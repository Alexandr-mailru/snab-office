"use client";

import { CartQtyCalculator } from "@/components/CartQtyCalculator";

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
  compact?: boolean;
  className?: string;
};

/** Product page / listings: cart button that becomes the qty calculator. */
export function AddToCartButton({ product, compact, className }: Props) {
  return (
    <CartQtyCalculator product={product} compact={compact} className={className} />
  );
}
