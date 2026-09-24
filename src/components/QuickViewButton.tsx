"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CartQtyCalculator } from "@/components/CartQtyCalculator";
import { parseProductImages, resolveProductImage } from "@/lib/productImages";
import { ProductRating } from "@/components/ProductRating";
import { formatPrice } from "@/lib/format";

export type QuickViewPreview = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  imageUrl: string | null;
  images: string;
  imageHint: string | null;
  brandName: string | null;
  ratingAvg: number;
  ratingCount: number;
};

export function QuickViewModal({
  slug,
  open,
  onClose,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [product, setProduct] = useState<QuickViewPreview | null>(null);
  const [mounted, setMounted] = useState(false);
  const [closeArmed, setCloseArmed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setCloseArmed(false);
      return;
    }
    // Avoid the opening tap immediately closing the newly mounted backdrop.
    const t = window.setTimeout(() => setCloseArmed(true), 180);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setProduct(null);
    setError(false);
    setLoading(true);

    fetch(`/api/products/${encodeURIComponent(slug)}/preview`)
      .then((r) => {
        if (!r.ok) throw new Error("preview failed");
        return r.json() as Promise<{ product?: QuickViewPreview }>;
      })
      .then((data) => {
        if (cancelled) return;
        setProduct(data.product ?? null);
        if (!data.product) setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, slug]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="quick-view-backdrop"
      role="presentation"
      onClick={() => {
        if (closeArmed) onClose();
      }}
    >
      <div
        className="quick-view-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="quick-view-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        {loading ? <p className="muted">Загрузка…</p> : null}
        {!loading && product ? (
          <div className="quick-view-grid">
            <div className="quick-view-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={parseProductImages(product.images, resolveProductImage(product))[0] ?? ""}
                alt=""
              />
            </div>
            <div className="quick-view-body">
              {product.brandName ? <p className="product-brand-line">{product.brandName}</p> : null}
              <h2 id={titleId}>{product.name}</h2>
              <ProductRating avg={product.ratingAvg} count={product.ratingCount} />
              <p className="quick-view-desc">{product.description}</p>
              <div className="price-row price-row-lg">
                <strong>{formatPrice(product.price)}</strong>
                {product.oldPrice ? <s>{formatPrice(product.oldPrice)}</s> : null}
              </div>
              <p className="muted quick-view-stock">
                {product.stock > 0 ? `В наличии: ${product.stock} шт.` : "Нет в наличии"}
              </p>
              <div className="quick-view-actions">
                <CartQtyCalculator product={product} />
                <Link href={`/product/${product.slug}`} className="btn btn-secondary" onClick={onClose}>
                  На страницу товара
                </Link>
              </div>
            </div>
          </div>
        ) : null}
        {!loading && error ? <p className="muted">Не удалось загрузить товар.</p> : null}
      </div>
    </div>,
    document.body,
  );
}

export function QuickViewButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost catalog-action-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        Быстрый просмотр
      </button>
      <QuickViewModal slug={slug} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
