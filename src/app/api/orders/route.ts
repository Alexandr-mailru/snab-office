import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { consentField } from "@/lib/consent";
import { sendCustomerOrderConfirmation } from "@/lib/customer-emails";
import { sendOrderNotifications } from "@/lib/order-notify";
import { generateOrderNumber, ORDER_STATUS } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    customerName: z.string().min(2),
    customerPhone: z.string().min(5),
    customerEmail: z.string().email().optional().or(z.literal("")),
    companyName: z.string().optional(),
    inn: z.string().optional(),
    comment: z.string().optional(),
    fulfillment: z.enum(["pickup", "delivery"]).default("pickup"),
    storeSlug: z.string().optional(),
    deliveryAddress: z.string().optional(),
    consent: consentField,
    items: z
      .array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "delivery") {
      const address = data.deliveryAddress?.trim() || "";
      if (address.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deliveryAddress"],
          message: "Укажите адрес доставки",
        });
      }
    }
    if (data.fulfillment === "pickup" && !data.storeSlug?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["storeSlug"],
        message: "Выберите магазин самовывоза",
      });
    }
  });

class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = schema.parse(json);
    const user = await getSessionUser();

    const uniqueIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueIds }, active: true },
    });
    if (products.length !== uniqueIds.length) {
      return NextResponse.json({ error: "Некоторые товары недоступны" }, { status: 400 });
    }

    const byId = Object.fromEntries(products.map((p) => [p.id, p]));
    const qtyById = new Map<string, number>();
    for (const item of data.items) {
      qtyById.set(item.productId, (qtyById.get(item.productId) || 0) + item.quantity);
    }

    const lines = [...qtyById.entries()].map(([productId, quantity]) => {
      const product = byId[productId];
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      };
    });

    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const storeSlug = data.storeSlug || null;
    const pickupStore =
      data.fulfillment === "pickup" && storeSlug
        ? await prisma.store.findUnique({ where: { slug: storeSlug } })
        : null;

    let order;
    let lastError: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      const number = generateOrderNumber();
      try {
        order = await prisma.$transaction(async (tx) => {
          for (const line of lines) {
            const updated = await tx.product.updateMany({
              where: { id: line.productId, stock: { gte: line.quantity }, active: true },
              data: { stock: { decrement: line.quantity } },
            });
            if (updated.count !== 1) {
              throw new StockError(`Недостаточно остатка: ${line.name}`);
            }

            if (pickupStore) {
              const storeUpdated = await tx.productStoreStock.updateMany({
                where: {
                  productId: line.productId,
                  storeId: pickupStore.id,
                  stock: { gte: line.quantity },
                },
                data: { stock: { decrement: line.quantity } },
              });
              // Store row may be missing — only fail if row exists but stock is low
              if (storeUpdated.count === 0) {
                const row = await tx.productStoreStock.findUnique({
                  where: {
                    productId_storeId: {
                      productId: line.productId,
                      storeId: pickupStore.id,
                    },
                  },
                });
                if (row) {
                  throw new StockError(`Нет в выбранном магазине: ${line.name}`);
                }
              }
            }
          }

          return tx.order.create({
            data: {
              number,
              ...(user?.id ? { user: { connect: { id: user.id } } } : {}),
              customerName: data.customerName,
              customerPhone: data.customerPhone,
              customerEmail: data.customerEmail || user?.email || null,
              companyName: data.companyName || null,
              inn: data.inn || null,
              comment: data.comment || null,
              fulfillment: data.fulfillment,
              storeSlug: data.fulfillment === "pickup" ? storeSlug : null,
              deliveryAddress:
                data.fulfillment === "delivery" ? data.deliveryAddress?.trim() || null : null,
              status: ORDER_STATUS.NEW,
              total,
              items: { create: lines },
            },
          });
        });
        break;
      } catch (err) {
        lastError = err;
        if (err instanceof StockError) throw err;
        // Unique number collision — retry
        const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
        if (code === "P2002") continue;
        throw err;
      }
    }

    if (!order) {
      console.error(lastError);
      return NextResponse.json({ error: "Не удалось создать заказ" }, { status: 500 });
    }

    const notifyPayload = {
      number: order.number,
      total: order.total,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      fulfillment: order.fulfillment,
      storeSlug: order.storeSlug,
      deliveryAddress: order.deliveryAddress,
      status: order.status,
      items: lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        price: line.price,
      })),
    };
    await sendOrderNotifications(notifyPayload);
    await sendCustomerOrderConfirmation(notifyPayload);

    return NextResponse.json({
      id: order.id,
      number: order.number,
    });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      const firstCustom = error.issues.find((issue) => issue.message)?.message;
      return NextResponse.json(
        {
          error: firstCustom || "Проверьте поля формы и согласие на обработку ПДн",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
