import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogActiveFilters } from "@/components/CatalogActiveFilters";
import { CatalogProductListing } from "@/components/CatalogProductListing";
import { parseCatalogParams, searchProducts } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  return {
    title: brand?.name ?? "Бренд",
    description: brand?.description || `Товары бренда ${brand?.name ?? ""} в магазине СнабОфис.`,
    openGraph: {
      title: brand?.name ?? "Бренд",
      description: brand?.description || undefined,
    },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const raw = await searchParams;
  const { view: _view, sort, storeSlug: _storeSlug, ...listing } = parseCatalogParams(raw);
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) notFound();
  const [result, brands, stores] = await Promise.all([
    searchProducts({ ...listing, brandSlug: slug, sort }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
      take: 80,
    }),
    prisma.store.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Бренды", href: "/brands" },
          { label: brand.name },
        ]}
      />
      <div className="page-header">
        <p className="eyebrow">Бренд</p>
        <h1 className="page-title">{brand.name}</h1>
        <p className="lead">{brand.description}</p>
      </div>
      <Suspense fallback={null}>
        <CatalogActiveFilters brands={brands} stores={stores} basePath={`/brands/${slug}`} />
      </Suspense>
      <Suspense fallback={null}>
        <CatalogProductListing
          initialResult={result}
          brandSlug={slug}
          emptyMessage="Пока нет товаров этого бренда в демо-каталоге."
        />
      </Suspense>
    </div>
  );
}
