"use client";

type MetrikaProduct = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  brand?: string;
  category?: string;
};

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

function metrikaId() {
  return process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
}

function pushEcommerce(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ ecommerce: payload });
}

export function trackAddToCart(product: MetrikaProduct) {
  const id = metrikaId();
  pushEcommerce({
    currencyCode: "RUB",
    add: {
      products: [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          brand: product.brand,
          category: product.category,
          quantity: product.quantity ?? 1,
        },
      ],
    },
  });
  if (id && typeof window.ym === "function") {
    window.ym(Number(id) || id, "reachGoal", "add_to_cart");
  }
}

export function trackRemoveFromCart(product: MetrikaProduct) {
  pushEcommerce({
    currencyCode: "RUB",
    remove: {
      products: [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity ?? 1,
        },
      ],
    },
  });
}

export function trackPurchase(order: {
  number: string;
  total: number;
  items: MetrikaProduct[];
}) {
  const id = metrikaId();
  pushEcommerce({
    currencyCode: "RUB",
    purchase: {
      actionField: { id: order.number, revenue: order.total },
      products: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity ?? 1,
      })),
    },
  });
  if (id && typeof window.ym === "function") {
    window.ym(Number(id) || id, "reachGoal", "purchase");
  }
}
