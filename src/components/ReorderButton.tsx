"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";

type ReorderItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imageHint?: string | null;
  imageUrl?: string | null;
  active: boolean;
};

export function ReorderButton({ items }: { items: ReorderItem[] }) {
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);

  function reorder() {
    const available = items.filter((i) => i.active);
    if (!available.length) {
      setMsg("Товары из заказа больше недоступны");
      return;
    }
    for (const item of available) {
      addItem(
        {
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          price: item.price,
          imageHint: item.imageHint,
          imageUrl: item.imageUrl,
        },
        item.quantity,
      );
    }
    setMsg(`Добавлено позиций: ${available.length}`);
    router.push("/cart");
  }

  return (
    <div className="reorder-wrap">
      <button type="button" className="btn btn-secondary" onClick={reorder}>
        Повторить заказ
      </button>
      {msg ? <p className="muted">{msg}</p> : null}
    </div>
  );
}
