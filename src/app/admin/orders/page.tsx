import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { OrderStatusActions } from "@/components/OrderStatusActions";
import { getSessionUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import {
  isOrderStatus,
  ORDER_STATUS,
  ORDER_STATUS_FLOW,
  orderStatusLabel,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Заказы",
  description: "Управление статусами заказов.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (!isAdminEmail(user.email)) {
    return (
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Нет доступа</h1>
          <p className="lead">Управление заказами доступно только администраторам.</p>
          <div className="cta-row">
            <Link href="/account/cabinet" className="btn btn-primary">
              В кабинет
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const statusRaw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const q = (qRaw || "").trim();
  const statusFilter = statusRaw && isOrderStatus(statusRaw) ? statusRaw : "ALL";

  const where = {
    ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    ...(q
      ? {
          OR: [
            { number: { contains: q } },
            { customerName: { contains: q } },
            { customerPhone: { contains: q } },
            { customerEmail: { contains: q } },
            { companyName: { contains: q } },
          ],
        }
      : {}),
  };

  const [newCount, orders] = await Promise.all([
    prisma.order.count({ where: { status: ORDER_STATUS.NEW } }),
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Админка</p>
        <h1 className="page-title">Заказы</h1>
        <p className="lead">Новых: {newCount}.</p>
        <AdminNav active="/admin/orders" />
      </div>

      <form className="panel form-grid admin-review-filters" method="get">
        <label>
          Поиск
          <input name="q" defaultValue={q} placeholder="Номер, клиент, телефон, email" />
        </label>
        <label>
          Статус
          <select name="status" defaultValue={statusFilter}>
            <option value="ALL">Все</option>
            {[...ORDER_STATUS_FLOW, ORDER_STATUS.CANCELLED].map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Применить
          </button>
          <Link href="/admin/orders" className="btn btn-secondary">
            Сбросить
          </Link>
        </div>
      </form>

      <section className="section section-tight-top">
        <div className="section-head">
          <h2>Найдено: {orders.length}</h2>
        </div>
        {orders.length ? (
          <div className="orders-list">
            {orders.map((order) => (
              <article key={order.id} className="panel order-card">
                <div className="order-card-head">
                  <div>
                    <strong>{order.number}</strong>
                    <p className="muted">
                      {formatDate(order.createdAt)} · {orderStatusLabel(order.status)} ·{" "}
                      {formatPrice(order.total)}
                    </p>
                    <p>
                      {order.customerName}, {order.customerPhone}
                      {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                    </p>
                    <p className="muted">
                      {order.fulfillment}
                      {order.storeSlug ? ` · ${order.storeSlug}` : ""}
                      {order.deliveryAddress ? ` · ${order.deliveryAddress}` : ""}
                      {order.companyName ? ` · ${order.companyName}` : ""}
                    </p>
                  </div>
                  <OrderStatusActions orderId={order.id} currentStatus={order.status} />
                </div>
                <ul className="doc-list">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.name} × {item.quantity} · {formatPrice(item.price)}
                    </li>
                  ))}
                </ul>
                {order.comment ? <p className="muted">Комментарий: {order.comment}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">По фильтрам ничего не найдено.</p>
        )}
      </section>
    </div>
  );
}
