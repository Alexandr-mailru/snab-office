import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { ReorderButton } from "@/components/ReorderButton";
import { getSessionUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { productGradient } from "@/lib/gradients";
import {
  canCustomerCancel,
  fulfillmentLabel,
  ORDER_STATUS,
  orderStatusLabel,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props) {
  const { number } = await params;
  return {
    title: `Заказ ${decodeURIComponent(number)}`,
    description: "Подробности заказа в личном кабинете «СнабОфис».",
  };
}

const STORE_LABELS: Record<string, string> = {
  kommunisticheskij: "Коммунистический пр., 49",
  purkaeva: "ул. Пуркаева, 110",
};

export default async function OrderDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/account");

  const number = decodeURIComponent((await params).number);
  const order = await prisma.order.findFirst({
    where: { number, userId: user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              active: true,
              imageHint: true,
              imageUrl: true,
              price: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const cancellable = canCustomerCancel(order.status);
  const cancelled = order.status === ORDER_STATUS.CANCELLED;

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Заказ</p>
        <h1 className="page-title">{order.number}</h1>
        <p className="lead">
          {formatDate(order.createdAt)} · {orderStatusLabel(order.status)} ·{" "}
          {formatPrice(order.total)}
        </p>
        <div className="cta-row">
          <Link href="/account/cabinet" className="btn btn-ghost">
            Назад в кабинет
          </Link>
          <ReorderButton
            items={order.items.map((item) => ({
              productId: item.productId,
              slug: item.product.slug,
              name: item.name,
              price: item.product.price || item.price,
              quantity: item.quantity,
              imageHint: item.product.imageHint,
              imageUrl: item.product.imageUrl,
              active: item.product.active,
            }))}
          />
          {cancellable ? <CancelOrderButton orderId={order.id} /> : null}
        </div>
        {cancelled ? (
          <p className="muted">Заказ отменён.</p>
        ) : null}
      </div>

      <div className="order-detail-layout layout-full">
        <section className="panel">
          <h2 className="title-no-margin">Состав заказа</h2>
          <ul className="order-lines">
            {order.items.map((item) => {
              const lineTotal = item.price * item.quantity;
              return (
                <li key={item.id} className="order-line">
                  <Link href={`/product/${item.product.slug}`} className="order-line-media" tabIndex={-1}>
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.imageUrl} alt="" />
                    ) : (
                      <span
                        className="order-line-fallback"
                        style={{ background: productGradient(item.product.imageHint) }}
                      />
                    )}
                  </Link>
                  <div className="order-line-body">
                    <Link href={`/product/${item.product.slug}`} className="order-line-name">
                      {item.name}
                    </Link>
                    <p className="muted order-line-meta">
                      {formatPrice(item.price)} × {item.quantity}
                      {item.product.unit ? ` ${item.product.unit}` : ""}
                    </p>
                  </div>
                  <strong className="order-line-total">{formatPrice(lineTotal)}</strong>
                </li>
              );
            })}
          </ul>
          <hr className="separator-line" />
          <p className="price-row">
            <span>Итого</span>
            <strong>{formatPrice(order.total)}</strong>
          </p>
        </section>

        <aside className="panel order-detail-aside">
          <h2 className="title-no-margin">Детали</h2>
          <dl className="order-meta-list">
            <div>
              <dt>Статус</dt>
              <dd>{orderStatusLabel(order.status)}</dd>
            </div>
            <div>
              <dt>Получение</dt>
              <dd>
                {fulfillmentLabel(order.fulfillment)}
                {order.storeSlug
                  ? ` · ${STORE_LABELS[order.storeSlug] || order.storeSlug}`
                  : ""}
              </dd>
            </div>
            {order.deliveryAddress ? (
              <div>
                <dt>Адрес доставки</dt>
                <dd>{order.deliveryAddress}</dd>
              </div>
            ) : null}
            <div>
              <dt>Получатель</dt>
              <dd>
                {order.customerName}
                <br />
                {order.customerPhone}
                {order.customerEmail ? (
                  <>
                    <br />
                    {order.customerEmail}
                  </>
                ) : null}
              </dd>
            </div>
            {order.companyName || order.inn ? (
              <div>
                <dt>Организация</dt>
                <dd>
                  {order.companyName || "—"}
                  {order.inn ? (
                    <>
                      <br />
                      ИНН {order.inn}
                    </>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {order.comment ? (
              <div>
                <dt>Комментарий</dt>
                <dd>{order.comment}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </div>
  );
}
