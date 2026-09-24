type OrderLine = {
  name: string;
  quantity: number;
  price: number;
};

type OrderNotifyPayload = {
  number: string;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  fulfillment: string;
  storeSlug?: string | null;
  deliveryAddress?: string | null;
  status?: string;
  items: OrderLine[];
};

function formatRub(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function toText(payload: OrderNotifyPayload) {
  const lines = payload.items
    .map((item) => `• ${item.name} × ${item.quantity} = ${formatRub(item.price * item.quantity)}`)
    .join("\n");
  return [
    `Новый заказ ${payload.number}`,
    payload.status ? `Статус: ${payload.status}` : null,
    `Сумма: ${formatRub(payload.total)}`,
    `Клиент: ${payload.customerName}, ${payload.customerPhone}`,
    payload.customerEmail ? `Email: ${payload.customerEmail}` : null,
    `Получение: ${payload.fulfillment}`,
    payload.storeSlug ? `Магазин: ${payload.storeSlug}` : null,
    payload.deliveryAddress ? `Адрес доставки: ${payload.deliveryAddress}` : null,
    "",
    lines,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendOrderNotifications(payload: OrderNotifyPayload) {
  const text = toText(payload);
  const webhook = process.env.ORDER_NOTIFY_WEBHOOK_URL;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const notifyEmail = process.env.ORDER_NOTIFY_EMAIL;

  const tasks: Promise<unknown>[] = [];

  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "snab-office",
          event: "order.created",
          text,
          payload,
        }),
      }),
    );
  }

  if (telegramToken && telegramChatId) {
    const tgUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    tasks.push(
      fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text,
          disable_web_page_preview: true,
        }),
      }),
    );
  }

  // Optional email webhook (e.g. Resend/Formspree-style endpoint)
  if (notifyEmail && webhook) {
    // already covered by webhook; keep email as separate channel only if dedicated URL set
  }
  const emailWebhook = process.env.ORDER_NOTIFY_EMAIL_WEBHOOK;
  if (emailWebhook && notifyEmail) {
    tasks.push(
      fetch(emailWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: notifyEmail,
          subject: `Заказ ${payload.number}`,
          text,
        }),
      }),
    );
  }

  if (!tasks.length) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[orders] No notify channels configured for ${payload.number}. Set ORDER_NOTIFY_WEBHOOK_URL or TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID.`,
      );
    } else {
      console.info(`[orders] ${text}`);
    }
    return;
  }

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[orders] notify failed", result.reason);
    }
  }
}
