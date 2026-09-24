import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/Breadcrumbs";
import { CatalogActiveFilters } from "@/components/CatalogActiveFilters";
import { CatalogAside } from "@/components/CatalogAside";
import { CatalogFiltersPanel } from "@/components/CatalogFiltersPanel";
import { CatalogProductListing } from "@/components/CatalogProductListing";
import { getCategoryTree } from "@/lib/auth";
import {
  getCatalogFacets,
  getCatalogPriceBounds,
  parseCatalogParams,
  searchProducts,
} from "@/lib/catalog";
import { resolveCategorySlug } from "@/lib/categoryAliases";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = resolveCategorySlug(rawSlug);
  const category = await prisma.category.findUnique({ where: { slug } });
  return {
    title: category?.name ?? "Категория",
    description: category?.description || `Товары категории ${category?.name ?? ""} в магазине СнабОфис.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params;
  const slug = resolveCategorySlug(rawSlug);
  if (slug !== rawSlug) redirect(`/catalog/${slug}`);

  const raw = await searchParams;
  const { view: _view, sort, storeSlug: _storeSlug, ...filters } = parseCatalogParams(raw);
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      parent: {
        include: {
          parent: {
            include: { parent: { include: { parent: true } } },
          },
        },
      },
    },
  });
  if (!category) notFound();

  const searchOpts = { ...filters, categorySlug: slug, sort };

  const [tree, result, stores, facets, priceBounds] = await Promise.all([
    getCategoryTree(),
    searchProducts(searchOpts),
    prisma.store.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    getCatalogFacets(searchOpts),
    getCatalogPriceBounds(searchOpts),
  ]);
  const brands = facets.brands;

  const crumbs: BreadcrumbItem[] = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog" },
  ];
  const ancestors: { name: string; slug: string }[] = [];
  let cursor:
    | {
        name: string;
        slug: string;
        parent?: {
          name: string;
          slug: string;
          parent?: {
            name: string;
            slug: string;
            parent?: {
              name: string;
              slug: string;
              parent?: { name: string; slug: string } | null;
            } | null;
          } | null;
        } | null;
      }
    | null
    | undefined = category.parent;
  while (cursor) {
    ancestors.unshift({ name: cursor.name, slug: cursor.slug });
    cursor = cursor.parent;
  }
  for (const a of ancestors) {
    crumbs.push({ label: a.name, href: `/catalog/${a.slug}` });
  }
  crumbs.push({ label: category.name });

  return (
    <div className="page-shell">
      <Breadcrumbs items={crumbs} />
      <div className="page-header">
        <p className="eyebrow">Категория</p>
        <h1 className="page-title">{category.name}</h1>
        <p className="lead">{category.description}</p>
        {category.children.length ? (
          <div className="cta-row category-subnav">
            {category.children.map((child) => (
              <Link key={child.id} href={`/catalog/${child.slug}`} className="btn btn-secondary">
                {child.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="catalog-layout layout-full">
        <Suspense fallback={null}>
          <CatalogAside
            activeCategorySlug={slug}
            filtersDefaultOpen={Boolean(
              (filters.filter && filters.filter !== "all") ||
                filters.brandSlug ||
                (filters.brandSlugs && filters.brandSlugs.length) ||
                (filters.colors && filters.colors.length) ||
                (filters.formats && filters.formats.length) ||
                typeof filters.minPrice === "number" ||
                typeof filters.maxPrice === "number" ||
                filters.inStock ||
                _storeSlug,
            )}
            categories={tree}
            filters={
              <CatalogFiltersPanel
                brands={brands}
                stores={stores}
                facets={facets}
                priceBounds={priceBounds}
                basePath={`/catalog/${slug}`}
              />
            }
          />
        </Suspense>
        <div>
          <Suspense fallback={null}>
            <CatalogActiveFilters brands={brands} stores={stores} basePath={`/catalog/${slug}`} />
          </Suspense>
          <Suspense fallback={null}>
            <CatalogProductListing
              initialResult={result}
              categorySlug={slug}
              emptyMessage="В этой категории пока нет товаров."
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
