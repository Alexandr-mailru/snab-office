import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Админ · Новости" };

export default async function AdminNewsPage() {
  await requireAdmin();
  const news = await prisma.news.findMany({ orderBy: { publishedAt: "desc" }, take: 50 });

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Админка</p>
        <h1 className="page-title">Новости</h1>
        <AdminNav active="/admin/news" />
        <div className="cta-row">
          <Link href="/admin/news/new" className="btn btn-primary">
            Добавить новость
          </Link>
        </div>
      </div>
      <ul className="doc-list">
        {news.map((item) => (
          <li key={item.id}>
            <Link href={`/admin/news/${item.id}`}>{item.title}</Link>
            <span className="muted"> — {formatDate(item.publishedAt)}</span>
            {" · "}
            <Link href={`/news/${item.slug}`}>на сайте</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
