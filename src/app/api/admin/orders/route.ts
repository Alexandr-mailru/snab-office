import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { sendCustomerOrderStatus } from "@/lib/customer-emails";
import { isOrderStatus, ORDER_STATUS, restoreOrderStock } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/reviews";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: status && isOrderStatus(status) ? { status } : undefined,
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const status = String(body.status || "");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Неизвестный статус" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  const wasCancelled = order.status === ORDER_STATUS.CANCELLED;
  const willCancel = status === ORDER_STATUS.CANCELLED;
  const statusChanged = order.status !== status;

  await prisma.$transaction(async (tx) => {
    if (willCancel && !wasCancelled) {
      await restoreOrderStock(tx, order);
    }

    await tx.order.update({
      where: { id },
      data: { status },
    });
  });

  if (statusChanged) {
    await sendCustomerOrderStatus({
      number: order.number,
      total: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      fulfillment: order.fulfillment,
      storeSlug: order.storeSlug,
      deliveryAddress: order.deliveryAddress,
      status,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }

  return NextResponse.json({ ok: true, status });
}
