import { fulfillmentLabel, orderStatusLabel } from "@/lib/orders";
import { mailFooterText, sendMail, siteUrl } from "@/lib/mail";

type OrderLine = { name: string; quantity: number; price: number };

type CustomerOrderMail = {
  number: string;
  total: number;
  customerName: string;
  customerEmail?: string | null;
  fulfillment: string;
  storeSlug?: string | null;
  deliveryAddress?: string | null;
  status: string;
  items: OrderLine[];
};

function formatRub(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function itemsBlock(items: OrderLine[]) {
  return items
    .map((item) => `• ${item.name} × ${item.quantity} = ${formatRub(item.price * item.quantity)}`)
    .join("\n");
}

export function buildOrderConfirmationMail(order: CustomerOrderMail) {
  const orderUrl = siteUrl(`/account/orders/${order.number}`);
  const subject = `Заказ ${order.number} принят — СнабОфис`;
  const text = [
    `Здравствуйте, ${order.customerName}!`,
    "",
    `Ваш заказ ${order.number} принят и передан в обработку.`,
    `Сумма: ${formatRub(order.total)}`,
    `Статус: ${orderStatusLabel(order.status)}`,
    `Получение: ${fulfillmentLabel(order.fulfillment)}`,
    order.storeSlug ? `Магазин: ${order.storeSlug}` : null,
    order.deliveryAddress ? `Адрес: ${order.deliveryAddress}` : null,
    "",
    "Состав заказа:",
    itemsBlock(order.items),
    "",
    `Следить за заказом: ${orderUrl}`,
    "Менеджер свяжется с вами для подтверждения.",
    mailFooterText(),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, text };
}

export function buildOrderStatusMail(order: CustomerOrderMail) {
  const orderUrl = siteUrl(`/account/orders/${order.number}`);
  const label = orderStatusLabel(order.status);
  const subject = `Заказ ${order.number}: ${label} — СнабОфис`;
  const text = [
    `Здравствуйте, ${order.customerName}!`,
    "",
    `Статус заказа ${order.number} изменён: ${label}.`,
    `Сумма: ${formatRub(order.total)}`,
    `Получение: ${fulfillmentLabel(order.fulfillment)}`,
    "",
    "Состав заказа:",
    itemsBlock(order.items),
    "",
    `Подробнее: ${orderUrl}`,
    mailFooterText(),
  ].join("\n");

  return { subject, text };
}

export async function sendCustomerOrderConfirmation(order: CustomerOrderMail) {
  if (!order.customerEmail) return false;
  const { subject, text } = buildOrderConfirmationMail(order);
  return sendMail({ to: order.customerEmail, subject, text });
}

export async function sendCustomerOrderStatus(order: CustomerOrderMail) {
  if (!order.customerEmail) return false;
  const { subject, text } = buildOrderStatusMail(order);
  return sendMail({ to: order.customerEmail, subject, text });
}

export async function sendPasswordResetMail(to: string, resetUrl: string) {
  const subject = "Сброс пароля — СнабОфис";
  const text = [
    "Здравствуйте!",
    "",
    "Вы запросили сброс пароля в интернет-магазине СнабОфис.",
    `Перейдите по ссылке (действует 1 час):`,
    resetUrl,
    "",
    "Если вы не запрашивали сброс, просто проигнорируйте это письмо.",
    mailFooterText(),
  ].join("\n");
  return sendMail({ to, subject, text });
}
