import type { Prisma } from "@prisma/client";

export const ORDER_STATUS = {
  NEW: "new",
  CONFIRMED: "confirmed",
  ASSEMBLING: "assembling",
  READY: "ready",
  DELIVERING: "delivering",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  assembling: "Сборка",
  ready: "Готов к выдаче",
  delivering: "Доставляется",
  done: "Выполнен",
  cancelled: "Отменён",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  ORDER_STATUS.NEW,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.ASSEMBLING,
  ORDER_STATUS.READY,
  ORDER_STATUS.DELIVERING,
  ORDER_STATUS.DONE,
];

/** Statuses the customer may cancel themselves. */
export const CUSTOMER_CANCELABLE: OrderStatus[] = [
  ORDER_STATUS.NEW,
  ORDER_STATUS.CONFIRMED,
];

export const FULFILLMENT_LABELS: Record<string, string> = {
  pickup: "Самовывоз",
  delivery: "Доставка",
  corporate: "Для организации",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return Object.values(ORDER_STATUS).includes(value as OrderStatus);
}

export function orderStatusLabel(status: string) {
  return isOrderStatus(status) ? ORDER_STATUS_LABELS[status] : status;
}

export function fulfillmentLabel(value: string) {
  return FULFILLMENT_LABELS[value] || value;
}

export function canCustomerCancel(status: string) {
  return CUSTOMER_CANCELABLE.includes(status as OrderStatus);
}

/** Unique-enough order number; retry on unique constraint at call site if needed. */
export function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AM-${ts}-${rnd}`;
}

/** Return reserved stock when an order is cancelled. */
export async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  order: {
    storeSlug: string | null;
    items: { productId: string; quantity: number }[];
  },
) {
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
    if (order.storeSlug) {
      const store = await tx.store.findUnique({ where: { slug: order.storeSlug } });
      if (store) {
        await tx.productStoreStock.updateMany({
          where: { productId: item.productId, storeId: store.id },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  }
}
