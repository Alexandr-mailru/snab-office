"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/metrika";
import { useCart } from "@/store/cart";

type ProductRef = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageHint?: string | null;
  imageUrl?: string | null;
  stock: number;
};

type Props = {
  product: ProductRef;
  className?: string;
  /** Show primary button until first add (default). */
  compact?: boolean;
};

export function CartQtyCalculator({ product, className, compact }: Props) {
  const qty = useCart(
    (s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0,
  );
  const addItem = useCart((s) => s.addItem);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const maxQty = Math.max(1, Math.min(99, product.stock > 0 ? product.stock : 99));
  const outOfStock = product.stock === 0;
  const inCart = qty > 0;

  const [draft, setDraft] = useState(String(qty || 1));

  useEffect(() => {
    setDraft(String(qty > 0 ? qty : 1));
  }, [qty]);

  function addOne() {
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        imageHint: product.imageHint,
        imageUrl: product.imageUrl,
      },
      1,
    );
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }

  function applyQty(raw: number | string) {
    const n = typeof raw === "string" ? Number.parseInt(raw, 10) : raw;
    if (!Number.isFinite(n) || n <= 0) {
      removeItem(product.id);
      return;
    }
    setQuantity(product.id, Math.min(maxQty, Math.max(1, Math.floor(n))));
  }

  function dec() {
    if (qty <= 1) {
      removeItem(product.id);
      return;
    }
    setQuantity(product.id, qty - 1);
  }

  function inc() {
    if (qty >= maxQty) return;
    if (!inCart) {
      addOne();
      return;
    }
    setQuantity(product.id, qty + 1);
  }

  function clearCart() {
    if (qty > 0) {
      trackRemoveFromCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
      });
    }
    removeItem(product.id);
  }

  if (outOfStock) {
    return (
      <button type="button" className="btn btn-primary btn-compact" disabled>
        Нет в наличии
      </button>
    );
  }

  if (!inCart) {
    return (
      <button
        type="button"
        className={`btn btn-primary ${compact ? "btn-compact" : ""} listing-cart-trigger`.trim()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addOne();
        }}
      >
        В корзину
      </button>
    );
  }

  return (
    <div
      className={`cart-qty-calc ${className ?? ""}`.trim()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cart-qty-calc-box" role="group" aria-label="Количество в корзине">
        <button
          type="button"
          className="cart-qty-calc-btn"
          aria-label="Уменьшить"
          onClick={dec}
        >
          −
        </button>
        <div className="cart-qty-calc-mid">
          <strong className="cart-qty-calc-price">{formatPrice(product.price * qty)}</strong>
          <label className="cart-qty-calc-field">
            <input
              type="number"
              className="cart-qty-calc-input"
              min={0}
              max={maxQty}
              inputMode="numeric"
              value={draft}
              aria-label="Количество штук"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => applyQty(draft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
            />
            <span className="cart-qty-calc-unit">шт</span>
          </label>
        </div>
        <button
          type="button"
          className="cart-qty-calc-btn"
          aria-label="Увеличить"
          disabled={qty >= maxQty}
          onClick={inc}
        >
          +
        </button>
      </div>
      <div className="cart-qty-calc-meta">
        <p className="cart-qty-calc-max">до {maxQty} шт</p>
        <button
          type="button"
          className="cart-qty-calc-clear"
          onClick={clearCart}
          aria-label="Убрать из корзины"
          title="Убрать из корзины"
        >
          {/* Material Design Icons — cart-remove (Apache 2.0), via Iconify */}
          <svg
            className="cart-qty-calc-clear-icon"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M14.1 8.5L12 6.4L9.9 8.5L8.5 7.1L10.6 5L8.5 2.9l1.4-1.4L12 3.6l2.1-2.1l1.4 1.4L13.4 5l2.1 2.1zM7 18c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m10 0c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m-9.8-3.2c0 .1.1.2.2.2H19v2H7c-1.1 0-2-.9-2-2c0-.4.1-.7.2-1l1.3-2.4L3 4H1V2h3.3l4.3 9h7l3.9-7l1.7 1l-3.9 7c-.3.6-1 1-1.7 1H8.1l-.9 1.6z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
