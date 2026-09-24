import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { AdminProductActions } from "@/components/AdminProductActions";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Админ · Товары" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
    include: { category: { select: { name: true } } },
  });

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Админка</p>
        <h1 className="page-title">Товары</h1>
        <AdminNav active="/admin/products" />
      </div>
      <div className="orders-list">
        {products.map((product) => (
          <article key={product.id} className="panel order-card">
            <div className="order-card-head">
              <div>
                <Link href={`/product/${product.slug}`} className="order-card-number">
                  {product.name}
                </Link>
                <p className="muted">
                  {product.category.name} · {formatPrice(product.price)} · остаток {product.stock}
                  {!product.active ? " · скрыт" : ""}
                  {product.featured ? " · хит" : ""}
                </p>
              </div>
            </div>
            <AdminProductActions product={product} />
          </article>
        ))}
      </div>
    </div>
  );
}
