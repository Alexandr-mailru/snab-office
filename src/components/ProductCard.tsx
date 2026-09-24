"use client";

import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
import { ProductListingActions } from "@/components/ProductListingActions";
import { ProductRating } from "@/components/ProductRating";
import { getStoreStock } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { parseProductImages, resolveProductImage } from "@/lib/productImages";
import Link from "next/link";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    oldPrice?: number | null;
    brandName?: string | null;
    imageHint?: string | null;
    imageUrl?: string | null;
    images?: string | null;
    stock: number;
    isNew?: boolean;
    onSale?: boolean;
    ratingAvg?: number;
    ratingCount?: number;
    storeStocks?: { stock: number; store: { slug: string; name: string } }[];
  };
  storeSlug?: string;
};

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const gallery = parseProductImages(product.images, resolveProductImage(product));
  const stock = getStoreStock(product, storeSlug);

  return (
    <article className="product-card">
      <ProductMediaCarousel
        name={product.name}
        href={`/product/${product.slug}`}
        images={gallery}
        imageHint={product.imageHint}
        variant="card"
        badges={
          <div className="product-badges">
            {product.isNew ? <span className="badge badge-new">Новинка</span> : null}
            {product.onSale ? <span className="badge badge-sale">Sale</span> : null}
          </div>
        }
      />
      <div className="product-body">
        <p className="product-brand-line">{product.brandName || "\u00A0"}</p>
        <h3>
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <ProductRating avg={product.ratingAvg ?? 0} count={product.ratingCount ?? 0} compact />
        <div className="product-meta">
          <div className="price-row">
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice ? <s>{formatPrice(product.oldPrice)}</s> : null}
          </div>
          <span className={stock > 0 ? "stock in" : "stock out"}>
            {storeSlug
              ? stock > 0
                ? `В магазине: ${stock} шт.`
                : "Нет в этом магазине"
              : stock > 0
                ? "В наличии"
                : "Под заказ"}
          </span>
        </div>
        <ProductListingActions product={{ ...product, stock }} layout="card" />
      </div>
    </article>
  );
}
