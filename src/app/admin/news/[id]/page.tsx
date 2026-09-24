import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AdminNewsForm } from "@/components/AdminNewsForm";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Админ · Редактирование новости" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminNewsEditPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const item = await prisma.news.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Админка</p>
        <h1 className="page-title">Редактирование</h1>
        <AdminNav active="/admin/news" />
      </div>
      <AdminNewsForm
        initial={{
          id: item.id,
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          body: item.body,
          coverImage: item.coverImage,
          publishedAt: item.publishedAt.toISOString(),
        }}
      />
    </div>
  );
}
