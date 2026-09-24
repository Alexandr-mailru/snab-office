import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { sendCustomerOrderStatus } from "@/lib/customer-emails";
import { canCustomerCancel, ORDER_STATUS, restoreOrderStock } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Войдите в кабинет" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  if (!canCustomerCancel(order.status)) {
    return NextResponse.json(
      {
        error:
          order.status === ORDER_STATUS.CANCELLED
            ? "Заказ уже отменён"
            : "Этот заказ уже нельзя отменить онлайн — позвоните менеджеру",
      },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await restoreOrderStock(tx, order);
    await tx.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.CANCELLED },
    });
  });

  await sendCustomerOrderStatus({
    number: order.number,
    total: order.total,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    fulfillment: order.fulfillment,
    storeSlug: order.storeSlug,
    deliveryAddress: order.deliveryAddress,
    status: ORDER_STATUS.CANCELLED,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });

  return NextResponse.json({ ok: true, status: ORDER_STATUS.CANCELLED });
}
