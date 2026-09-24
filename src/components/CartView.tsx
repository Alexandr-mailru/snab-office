"use client";

import Link from "next/link";
import { CartQtyCalculator } from "@/components/CartQtyCalculator";
import { formatPrice } from "@/lib/format";
import { productGradient } from "@/lib/gradients";
import { useCart } from "@/store/cart";

type Props = {
  isLoggedIn: boolean;
};

export function CartView({ isLoggedIn }: Props) {
  const { items, totalPrice } = useCart();
  const checkoutHref = isLoggedIn
    ? "/checkout"
    : `/account?next=${encodeURIComponent("/checkout")}`;

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Заказ</p>
        <h1 className="page-title">Корзина</h1>
      </div>

      {!items.length ? (
        <div className="panel empty-state cart-empty">
          <p>Корзина пуста.</p>
          <div className="cta-row">
            <Link href="/catalog" className="btn btn-primary">
              Перейти в каталог
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout layout-full">
          <div className="panel">
            {items.map((item) => (
              <div key={item.productId} className="cart-item">
                <Link href={`/product/${item.slug}`} className="cart-item-media" aria-hidden>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="cart-item-image" />
                  ) : (
                    <div
                      className="thumb"
                      style={{ background: productGradient(item.imageHint) }}
                    />
                  )}
                </Link>
                <div className="cart-item-main">
                  <Link href={`/product/${item.slug}`}>
                    <strong>{item.name}</strong>
                  </Link>
                  <p className="muted">{formatPrice(item.price)}</p>
                  <div className="cart-item-controls">
                    <CartQtyCalculator
                      product={{
                        id: item.productId,
                        slug: item.slug,
                        name: item.name,
                        price: item.price,
                        imageHint: item.imageHint,
                        imageUrl: item.imageUrl,
                        stock: 99,
                      }}
                      className="cart-item-qty-calc"
                    />
                  </div>
                </div>
                <strong className="cart-item-total">
                  {formatPrice(item.price * item.quantity)}
                </strong>
              </div>
            ))}
          </div>

          <aside className="panel">
            <h2 className="title-no-margin">Итого</h2>
            <p className="price-row">
              <span>Сумма</span>
              <strong>{formatPrice(totalPrice())}</strong>
            </p>
            <p className="muted">
              {isLoggedIn
                ? "Самовывоз из магазина или заказ для компании на следующем шаге."
                : "Чтобы оформить заказ, войдите в личный кабинет."}
            </p>
            <Link href={checkoutHref} className="btn btn-primary cart-checkout-btn">
              {isLoggedIn ? "Оформить заказ" : "Войти для оформления заказа"}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
