import Link from "next/link";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { ReorderButton } from "@/components/ReorderButton";
import { formatDate, formatPrice } from "@/lib/format";
import { productGradient } from "@/lib/gradients";
import { canCustomerCancel, orderStatusLabel } from "@/lib/orders";

type OrderItemView = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  product: {
    slug: string;
    active: boolean;
    imageHint: string | null;
    imageUrl: string | null;
    price: number;
  };
};

type OrderView = {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItemView[];
};

export function OrderCard({ order }: { order: OrderView }) {
  const preview = order.items.slice(0, 4);
  const extra = order.items.length - preview.length;
  const cancellable = canCustomerCancel(order.status);

  return (
    <article className="panel order-card">
      <div className="order-card-head">
        <div>
          <Link href={`/account/orders/${encodeURIComponent(order.number)}`} className="order-card-number">
            {order.number}
          </Link>
          <p className="muted">
            {formatDate(order.createdAt)} · {orderStatusLabel(order.status)} ·{" "}
            {formatPrice(order.total)}
          </p>
        </div>
        <div className="order-card-actions">
          <Link
            href={`/account/orders/${encodeURIComponent(order.number)}`}
            className="btn btn-secondary"
          >
            Подробнее
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
      </div>

      <ul className="order-card-preview">
        {preview.map((item) => (
          <li key={item.id} className="order-card-preview-item">
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
            <div className="order-card-preview-body">
              <Link href={`/product/${item.product.slug}`}>{item.name}</Link>
              <p className="muted">
                × {item.quantity} · {formatPrice(item.price)}
              </p>
            </div>
            <strong>{formatPrice(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>
      {extra > 0 ? (
        <p className="muted order-card-more">
          Ещё {extra}{" "}
          <Link href={`/account/orders/${encodeURIComponent(order.number)}`}>в заказе</Link>
        </p>
      ) : null}
    </article>
  );
}
