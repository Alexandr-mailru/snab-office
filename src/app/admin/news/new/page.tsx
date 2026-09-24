import { AdminNav } from "@/components/AdminNav";
import { AdminNewsForm } from "@/components/AdminNewsForm";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Админ · Новая новость" };

export default async function AdminNewsNewPage() {
  await requireAdmin();
  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Админка</p>
        <h1 className="page-title">Новая новость</h1>
        <AdminNav active="/admin/news" />
      </div>
      <AdminNewsForm />
    </div>
  );
}
