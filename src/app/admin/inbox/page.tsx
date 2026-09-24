import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Админ · Заявки" };

export default async function AdminInboxPage() {
  await requireAdmin();
  const [feedback, applications] = await Promise.all([
    prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.jobApplication.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Админка</p>
        <h1 className="page-title">Заявки</h1>
        <AdminNav active="/admin/inbox" />
      </div>

      <section className="section section-tight-top">
        <div className="section-head">
          <h2>Обратная связь ({feedback.length})</h2>
        </div>
        <div className="orders-list">
          {feedback.length ? (
            feedback.map((item) => (
              <article key={item.id} className="panel my-review-card">
                <div className="my-review-card-head">
                  <strong>{item.category}</strong>
                  <time className="muted">{formatDate(item.createdAt)}</time>
                </div>
                <p>
                  {item.name} · <a href={`mailto:${item.email}`}>{item.email}</a>
                </p>
                <p className="my-review-body" style={{ WebkitLineClamp: "unset" }}>
                  {item.message}
                </p>
              </article>
            ))
          ) : (
            <p className="muted">Пока нет обращений.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Отклики на вакансии ({applications.length})</h2>
        </div>
        <div className="orders-list">
          {applications.length ? (
            applications.map((item) => (
              <article key={item.id} className="panel my-review-card">
                <div className="my-review-card-head">
                  <strong>{item.vacancySlug}</strong>
                  <time className="muted">{formatDate(item.createdAt)}</time>
                </div>
                <p>
                  {item.fullName} · <a href={`mailto:${item.email}`}>{item.email}</a>
                </p>
                <p className="muted">Контакты: {item.contacts}</p>
                <p className="muted">Образование: {item.education}</p>
                <p>{item.experience}</p>
                {item.extra ? <p className="muted">{item.extra}</p> : null}
              </article>
            ))
          ) : (
            <p className="muted">Пока нет откликов.</p>
          )}
        </div>
      </section>
    </div>
  );
}
