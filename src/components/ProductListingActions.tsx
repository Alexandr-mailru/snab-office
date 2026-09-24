"use client";

import { useCallback, useState } from "react";
import { CartQtyCalculator } from "@/components/CartQtyCalculator";
import { QuickViewModal } from "@/components/QuickViewButton";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    imageHint?: string | null;
    imageUrl?: string | null;
    stock: number;
  };
  layout?: "card" | "list";
};

export function ProductListingActions({ product, layout = "card" }: Props) {
  const [quickOpen, setQuickOpen] = useState(false);
  const closeQuick = useCallback(() => setQuickOpen(false), []);

  return (
    <div className={`product-listing-actions ${layout === "list" ? "is-list" : ""}`}>
      <button
        type="button"
        className="btn btn-ghost catalog-action-btn listing-quick-view"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setQuickOpen(true);
        }}
      >
        Быстрый просмотр
      </button>
      <CartQtyCalculator product={product} compact />
      <QuickViewModal slug={product.slug} open={quickOpen} onClose={closeQuick} />
    </div>
  );
}
