"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";
import { SiteForm } from "@/components/SiteForm";
import { formatPrice } from "@/lib/format";
import { trackPurchase } from "@/lib/metrika";
import { useCart } from "@/store/cart";

export type CheckoutDefaults = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  companyName: string;
  inn: string;
};

type Fulfillment = "pickup" | "delivery";
type StoreSlug = "kommunisticheskij" | "purkaeva";

const PICKUP_STORES: { slug: StoreSlug; title: string; hint: string }[] = [
  {
    slug: "kommunisticheskij",
    title: "Коммунистический пр., 49",
    hint: "«СнабОфис» · канцелярия и офис",
  },
  {
    slug: "purkaeva",
    title: "ул. Пуркаева, 110",
    hint: "Супермаркет «СнабОфис» · школа и творчество",
  },
];

export function CheckoutForm({
  defaults,
  initialForOrg = false,
}: {
  defaults: CheckoutDefaults | null;
  initialForOrg?: boolean;
}) {
  const { items, totalPrice, clear } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [storeSlug, setStoreSlug] = useState<StoreSlug>("purkaeva");
  const [forOrg, setForOrg] = useState(initialForOrg);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length) return;

    setStatus("loading");
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") || ""),
      customerPhone: String(form.get("customerPhone") || ""),
      customerEmail: String(form.get("customerEmail") || ""),
      companyName: forOrg ? String(form.get("companyName") || "") : "",
      inn: forOrg ? String(form.get("inn") || "") : "",
      comment: String(form.get("comment") || ""),
      fulfillment,
      storeSlug: fulfillment === "pickup" ? storeSlug : "",
      deliveryAddress:
        fulfillment === "delivery" ? String(form.get("deliveryAddress") || "").trim() : "",
      consent: form.get("consent") === "true",
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось оформить заказ");
      trackPurchase({
        number: data.number,
        total: totalPrice(),
        items: items.map((item) => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      setOrderNumber(data.number);
      clear();
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Ошибка оформления");
    }
  }

  if (!items.length && status !== "done") {
    return (
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Оформление</h1>
        </div>
        <div className="panel empty-state">
          <p>Сначала добавьте товары в корзину.</p>
          <div className="cta-row">
            <Link href="/catalog" className="btn btn-primary">
              В каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Заказ принят</h1>
          <p className="lead">
            Номер заказа <strong>{orderNumber}</strong>. Менеджер свяжется для подтверждения.
          </p>
          <div className="cta-row">
            <Link href="/catalog" className="btn btn-primary">
              Продолжить покупки
            </Link>
            {orderNumber ? (
              <Link
                href={`/account/orders/${encodeURIComponent(orderNumber)}`}
                className="btn btn-secondary"
              >
                Смотреть заказ
              </Link>
            ) : (
              <Link href="/account/cabinet" className="btn btn-secondary">
                Мои заказы
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow">Почти готово</p>
        <h1 className="page-title">Оформление заказа</h1>
        {defaults ? (
          <p className="muted">Данные подставлены из профиля — проверьте перед отправкой.</p>
        ) : null}
      </div>

      <div className="checkout-layout layout-full">
        <SiteForm className="panel form-grid" onSubmit={onSubmit}>
          <label>
            Имя *
            <input
              name="customerName"
              required
              placeholder="Как к вам обращаться"
              defaultValue={defaults?.customerName || ""}
            />
          </label>
          <label>
            Телефон *
            <input
              name="customerPhone"
              required
              placeholder="+7 ..."
              defaultValue={defaults?.customerPhone || ""}
            />
          </label>
          <label>
            Email
            <input
              name="customerEmail"
              type="email"
              placeholder="для статуса заказа"
              defaultValue={defaults?.customerEmail || ""}
            />
          </label>

          <fieldset className="checkout-choice">
            <legend>Способ получения</legend>
            <div className="checkout-choice-row" role="radiogroup" aria-label="Способ получения">
              <label className={`checkout-choice-card ${fulfillment === "pickup" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="pickup"
                  checked={fulfillment === "pickup"}
                  onChange={() => setFulfillment("pickup")}
                />
                <span className="checkout-choice-title">Самовывоз</span>
                <span className="checkout-choice-hint">Заберу в магазине</span>
              </label>
              <label className={`checkout-choice-card ${fulfillment === "delivery" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="delivery"
                  checked={fulfillment === "delivery"}
                  onChange={() => setFulfillment("delivery")}
                />
                <span className="checkout-choice-title">Доставка</span>
                <span className="checkout-choice-hint">От 2000 ₽ бесплатно по городу</span>
              </label>
            </div>
          </fieldset>

          {fulfillment === "pickup" ? (
            <fieldset className="checkout-choice checkout-store-choice">
              <legend>Магазин самовывоза *</legend>
              <div className="checkout-choice-row" role="radiogroup" aria-label="Магазин самовывоза">
                {PICKUP_STORES.map((store) => (
                  <label
                    key={store.slug}
                    className={`checkout-choice-card ${storeSlug === store.slug ? "is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="storeSlug"
                      value={store.slug}
                      checked={storeSlug === store.slug}
                      onChange={() => setStoreSlug(store.slug)}
                      required={fulfillment === "pickup"}
                    />
                    <span className="checkout-choice-title">{store.title}</span>
                    <span className="checkout-choice-hint">{store.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="checkout-delivery-address">
              <label>
                Адрес доставки
                <input
                  name="deliveryAddress"
                  required
                  autoComplete="street-address"
                  placeholder="Улица, дом, квартира"
                />
              </label>
              <p className="checkout-field-note muted">
                Доставка — по Москве и ближайшим населённым пунктам. Менеджер
                подтвердит возможность доставки по вашему адресу.
              </p>
            </div>
          )}

          <label className={`checkout-org-toggle ${forOrg ? "is-on" : ""}`}>
            <input
              type="checkbox"
              className="site-checkbox"
              checked={forOrg}
              onChange={(e) => setForOrg(e.target.checked)}
            />
            <span>
              <strong>Оформить на организацию</strong>
              <span className="checkout-choice-hint">Договор, отгрузка на юрлицо</span>
            </span>
          </label>

          {forOrg ? (
            <fieldset className="checkout-org-fields">
              <legend className="sr-only">Реквизиты организации</legend>
              <label>
                Название компании *
                <input
                  name="companyName"
                  required={forOrg}
                  placeholder="ООО «Пример»"
                  defaultValue={defaults?.companyName || ""}
                />
              </label>
              <label>
                ИНН *
                <input
                  name="inn"
                  required={forOrg}
                  placeholder="10 или 12 цифр"
                  inputMode="numeric"
                  defaultValue={defaults?.inn || ""}
                />
              </label>
            </fieldset>
          ) : null}

          <label>
            Комментарий
            <textarea
              name="comment"
              rows={4}
              placeholder={
                fulfillment === "delivery"
                  ? "Удобное время, подъезд, домофон"
                  : "Удобное время, детали заказа"
              }
            />
          </label>
          <ConsentCheckbox />
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Отправляем..." : "Подтвердить заказ"}
          </button>
        </SiteForm>

        <aside className="panel">
          <h2 className="title-no-margin">Ваш заказ</h2>
          {items.map((item) => (
            <p key={item.productId} className="price-row">
              <span>
                {item.name} × {item.quantity}
              </span>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </p>
          ))}
          <hr className="separator-line" />
          <p className="price-row">
            <span>Итого</span>
            <strong>{formatPrice(totalPrice())}</strong>
          </p>
          <p className="muted checkout-summary-meta">
            {fulfillment === "pickup" ? "Самовывоз" : "Доставка"}
            {forOrg ? " · на организацию" : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}
