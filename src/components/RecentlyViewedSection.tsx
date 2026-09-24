"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { readRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";

export function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    setItems(readRecentlyViewed());
  }, []);

  if (!items.length) return null;

  return (
    <section className="section-tight-top">
      <div className="page-header">
        <h2 className="page-title title-no-margin">Недавно просмотренные</h2>
      </div>
      <div className="product-grid">
        {items.slice(0, 4).map((item) => (
          <ProductCard
            key={item.slug}
            product={{
              id: item.id,
              slug: item.slug,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl,
              stock: 1,
            }}
          />
        ))}
      </div>
      {items.length > 4 ? (
        <p className="text-gap-md">
          <Link href="/catalog">Смотреть каталог</Link>
        </p>
      ) : null}
    </section>
  );
}
