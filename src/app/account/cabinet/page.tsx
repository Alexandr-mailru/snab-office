import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { OrderCard } from "@/components/OrderCard";
import { ProductCard } from "@/components/ProductCard";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isAdminEmail, REVIEW_STATUS } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Личный кабинет",
  description: "Заказы, избранное и повтор покупок в «СнабОфис».",
};

export default async function CabinetPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account");

  const [orders, favorites, myReviews] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { select: { slug: true, active: true, imageHint: true, imageUrl: true, price: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      include: { product: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Мой кабинет</p>
        <h1 className="page-title">Здравствуйте, {user.name}</h1>
        <p className="lead">{user.email}</p>
        <div className="cta-row">
          <Link href="/catalog" className="btn btn-primary">
            В каталог
          </Link>
          {isAdminEmail(user.email) ? (
            <>
              <Link href="/admin/orders" className="btn btn-ghost">
                Админка
              </Link>
            </>
          ) : null}
          <LogoutButton />
        </div>
      </div>

      <div className="split-band layout-full">
        <article className="info-card">
          <h3>Профиль</h3>
          <ProfileEditForm
            initial={{
              phone: user.phone,
              companyName: user.companyName,
              inn: user.inn,
              buyAsOrg: user.buyAsOrg,
            }}
          />
        </article>
        <article className="info-card">
          <h3>Краткая сводка</h3>
          <p>Заказов: {orders.length}</p>
          <p>В избранном: {favorites.length}</p>
          <p>Отзывов: {myReviews.length}</p>
        </article>
      </div>

      <section className="section section-tight-top">
        <div className="section-head">
          <h2>Избранное</h2>
        </div>
        {favorites.length ? (
          <div className="product-grid">
            {favorites.map((fav) => (
              <ProductCard key={fav.id} product={fav.product} />
            ))}
          </div>
        ) : (
          <p className="muted">Пока пусто — добавьте товары кнопкой «В избранное».</p>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Мои отзывы</h2>
        </div>
        {myReviews.length ? (
          <div className="my-reviews-grid">
            {myReviews.map((review) => {
              const statusLabel =
                review.status === REVIEW_STATUS.PENDING
                  ? "На модерации"
                  : review.status === REVIEW_STATUS.APPROVED
                    ? "Опубликован"
                    : "Отклонён";
              const statusClass =
                review.status === REVIEW_STATUS.PENDING
                  ? "is-pending"
                  : review.status === REVIEW_STATUS.APPROVED
                    ? "is-approved"
                    : "is-rejected";
              return (
                <article key={review.id} className="panel my-review-card">
                  <div className="my-review-card-head">
                    <span className={`my-review-status ${statusClass}`}>{statusLabel}</span>
                    <time className="muted" dateTime={review.createdAt.toISOString()}>
                      {formatDate(review.createdAt)}
                    </time>
                  </div>
                  <Link href={`/product/${review.product.slug}`} className="my-review-product">
                    {review.product.name}
                  </Link>
                  <p className="my-review-stars" aria-label={`Оценка ${review.rating} из 5`}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                  {review.body ? <p className="my-review-body">{review.body}</p> : null}
                  <Link href={`/product/${review.product.slug}`} className="btn btn-ghost">
                    К товару
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted">Пока нет отзывов.</p>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Заказы</h2>
        </div>
        {orders.length ? (
          <div className="orders-list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <p className="muted">Заказов пока нет.</p>
        )}
      </section>
    </div>
  );
}
