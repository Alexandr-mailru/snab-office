"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  active: boolean;
  featured: boolean;
  isNew: boolean;
  onSale: boolean;
};

export function AdminProductActions({ product }: { product: ProductRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));

  async function save(patch: Record<string, unknown>) {
    setLoading(true);
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, ...patch }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="admin-product-actions">
      <label>
        Цена
        <input
          value={price}
          inputMode="numeric"
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => {
            const n = Number(price);
            if (Number.isFinite(n) && n !== product.price) void save({ price: Math.max(0, Math.round(n)) });
          }}
        />
      </label>
      <label>
        Остаток
        <input
          value={stock}
          inputMode="numeric"
          onChange={(e) => setStock(e.target.value)}
          onBlur={() => {
            const n = Number(stock);
            if (Number.isFinite(n) && n !== product.stock) void save({ stock: Math.max(0, Math.round(n)) });
          }}
        />
      </label>
      <div className="cta-row">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={() => void save({ active: !product.active })}
        >
          {product.active ? "Скрыть" : "Показать"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={() => void save({ featured: !product.featured })}
        >
          {product.featured ? "Убрать из хитов" : "В хиты"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={() => void save({ isNew: !product.isNew })}
        >
          {product.isNew ? "Не новинка" : "Новинка"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={() => void save({ onSale: !product.onSale })}
        >
          {product.onSale ? "Снять акцию" : "Акция"}
        </button>
      </div>
    </div>
  );
}
