"use client";

import Link from "next/link";
import { parseProductImages, resolveProductImage } from "@/lib/productImages";
import { ProductListingActions } from "@/components/ProductListingActions";
import { ProductMediaCarousel } from "@/components/ProductMediaCarousel";
import { ProductRating } from "@/components/ProductRating";
import { getStoreStock } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

type ProductListRowProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    oldPrice?: number | null;
    brandName?: string | null;
    imageHint?: string | null;
    imageUrl?: string | null;
    images?: string | null;
    sku?: string | null;
    stock: number;
    isNew?: boolean;
    onSale?: boolean;
    ratingAvg?: number;
    ratingCount?: number;
    storeStocks?: { stock: number; store: { slug: string; name: string } }[];
  };
  storeSlug?: string;
};

export function ProductListRow({ product, storeSlug }: ProductListRowProps) {
  const gallery = parseProductImages(product.images, resolveProductImage(product));
  const stock = getStoreStock(product, storeSlug);

  return (
    <article className="product-list-row">
      <div className="product-list-media">
        <ProductMediaCarousel
          name={product.name}
          href={`/product/${product.slug}`}
          images={gallery}
          imageHint={product.imageHint}
          variant="list"
        />
      </div>

      <div className="product-list-body">
        <div className="product-list-badges">
          {product.isNew ? <span className="badge badge-new">Новинка</span> : null}
          {product.onSale ? <span className="badge badge-sale">Sale</span> : null}
        </div>
        {product.brandName ? <p className="product-brand-line">{product.brandName}</p> : null}
        <h3>
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <ProductRating avg={product.ratingAvg ?? 0} count={product.ratingCount ?? 0} compact />
        {product.sku ? <p className="product-list-sku muted">Артикул: {product.sku}</p> : null}
        <p className="product-list-desc">{product.description}</p>
      </div>

      <div className="product-list-side">
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
        <ProductListingActions product={{ ...product, stock }} layout="list" />
        <Link href={`/product/${product.slug}`} className="btn btn-secondary product-list-link">
          Подробнее
        </Link>
      </div>
    </article>
  );
}
