import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { ReviewModerationActions } from "@/components/ReviewModerationActions";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isAdminEmail, REVIEW_STATUS } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Модерация отзывов",
  description: "Проверка отзывов перед публикацией.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/account");
  if (!isAdminEmail(user.email)) {
    return (
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Нет доступа</h1>
          <p className="lead">Модерация доступна только администраторам.</p>
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
  const statusFilter =
    statusRaw === REVIEW_STATUS.PENDING ||
    statusRaw === REVIEW_STATUS.APPROVED ||
    statusRaw === REVIEW_STATUS.REJECTED
      ? statusRaw
      : "ALL";

  const baseWhere = {
    ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    ...(q
      ? {
          OR: [
            { body: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
            { product: { name: { contains: q } } },
          ],
        }
      : {}),
  } as const;

  const [pending, filtered, recent] = await Promise.all([
    prisma.review.findMany({
      where: { status: REVIEW_STATUS.PENDING },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.review.findMany({
      where: baseWhere,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 80,
    }),
    prisma.review.findMany({
      where: { status: { in: [REVIEW_STATUS.APPROVED, REVIEW_STATUS.REJECTED] } },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { moderatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Админка</p>
        <h1 className="page-title">Модерация отзывов</h1>
        <p className="lead">
          На проверке: {pending.length}. Опубликованные отзывы видны на карточке товара и влияют на
          рейтинг.
        </p>
        <AdminNav active="/admin/reviews" />
      </div>

      <form className="panel form-grid admin-review-filters" method="get">
        <label>
          Поиск
          <input name="q" defaultValue={q} placeholder="Товар, автор, email, текст" />
        </label>
        <label>
          Статус
          <select name="status" defaultValue={statusFilter}>
            <option value="ALL">Все</option>
            <option value={REVIEW_STATUS.PENDING}>На модерации</option>
            <option value={REVIEW_STATUS.APPROVED}>Опубликован</option>
            <option value={REVIEW_STATUS.REJECTED}>Отклонён</option>
          </select>
        </label>
        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Применить
          </button>
          <Link href="/admin/reviews" className="btn btn-secondary">
            Сбросить
          </Link>
        </div>
      </form>

      <section className="section section-tight-top">
        <div className="section-head">
          <h2>Найдено: {filtered.length}</h2>
        </div>
        {filtered.length ? (
          <div className="orders-list">
            {filtered.map((review) => (
              <article key={review.id} className="panel order-card">
                <p className="review-meta">
                  <strong>{review.user.name}</strong> ({review.user.email}) · {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)} · {formatDate(review.createdAt)}
                </p>
                <p>
                  Товар: <Link href={`/product/${review.product.slug}`}>{review.product.name}</Link> ·{" "}
                  <strong>
                    {review.status === REVIEW_STATUS.PENDING
                      ? "На модерации"
                      : review.status === REVIEW_STATUS.APPROVED
                        ? "Опубликован"
                        : "Отклонён"}
                  </strong>
                </p>
                <p>{review.body}</p>
                {review.status === REVIEW_STATUS.PENDING ? (
                  <ReviewModerationActions reviewId={review.id} />
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">По фильтрам ничего не найдено.</p>
        )}
      </section>

      <section className="section section-tight-top">
        <div className="section-head">
          <h2>Ожидают проверки</h2>
        </div>
        {pending.length ? (
          <div className="orders-list">
            {pending.map((review) => (
              <article key={review.id} className="panel order-card">
                <p className="review-meta">
                  <strong>{review.user.name}</strong> ({review.user.email}) ·{" "}
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)} · {formatDate(review.createdAt)}
                </p>
                <p>
                  Товар:{" "}
                  <Link href={`/product/${review.product.slug}`}>{review.product.name}</Link>
                </p>
                <p>{review.body}</p>
                <ReviewModerationActions reviewId={review.id} />
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Очередь пуста.</p>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Недавние решения</h2>
        </div>
        {recent.length ? (
          <ul className="doc-list">
            {recent.map((review) => (
              <li key={review.id}>
                <strong>{review.status === REVIEW_STATUS.APPROVED ? "Опубликован" : "Отклонён"}</strong>
                {" · "}
                {review.user.name} ·{" "}
                <Link href={`/product/${review.product.slug}`}>{review.product.name}</Link>
                {review.moderatedAt ? ` · ${formatDate(review.moderatedAt)}` : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Пока нет.</p>
        )}
      </section>
    </div>
  );
}
