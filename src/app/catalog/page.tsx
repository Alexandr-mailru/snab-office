import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogActiveFilters } from "@/components/CatalogActiveFilters";
import { CatalogAside } from "@/components/CatalogAside";
import { CatalogFiltersPanel } from "@/components/CatalogFiltersPanel";
import { CatalogProductListing } from "@/components/CatalogProductListing";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import { getCategoryTree } from "@/lib/auth";
import {
  getCatalogFacets,
  getCatalogPriceBounds,
  parseCatalogParams,
  searchProducts,
} from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(params: {
  filter?: string;
  brandSlug?: string;
  brandSlugs?: string[];
  colors?: string[];
  formats?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  storeSlug?: string;
}) {
  return Boolean(
    (params.filter && params.filter !== "all") ||
      params.brandSlug ||
      (params.brandSlugs && params.brandSlugs.length) ||
      (params.colors && params.colors.length) ||
      (params.formats && params.formats.length) ||
      typeof params.minPrice === "number" ||
      typeof params.maxPrice === "number" ||
      params.inStock ||
      params.storeSlug,
  );
}

export async function generateMetadata({ searchParams }: Props) {
  const params = parseCatalogParams(await searchParams);
  const title =
    params.filter === "new" ? "Новинки" : params.filter === "sale" ? "Распродажа" : "Каталог";
  return {
    title,
    description: "Каталог канцелярии и товаров для офиса «СнабОфис» в Москве.",
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const raw = await searchParams;
  const { view: _view, sort, storeSlug: _storeSlug, ...params } = parseCatalogParams(raw);
  const searchOpts = { ...params, sort };

  const [categories, result, stores, facets, priceBounds] = await Promise.all([
    getCategoryTree(),
    searchProducts(searchOpts),
    prisma.store.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    getCatalogFacets(searchOpts),
    getCatalogPriceBounds(searchOpts),
  ]);
  const brands = facets.brands;

  const title =
    params.filter === "new" ? "Новинки" : params.filter === "sale" ? "Распродажа" : "Каталог";

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: title }]} />
      <div className="page-header">
        <p className="eyebrow">Ассортимент</p>
        <h1 className="page-title">{title}</h1>
        <p className="lead">Фильтры по бренду, цене, цвету, формату и наличию в магазинах.</p>
      </div>

      <div className="catalog-layout layout-full">
        <Suspense fallback={null}>
          <CatalogAside
            filtersDefaultOpen={hasActiveFilters({ ...params, storeSlug: _storeSlug })}
            categories={categories}
            filters={
              <CatalogFiltersPanel
                brands={brands}
                stores={stores}
                facets={facets}
                priceBounds={priceBounds}
                basePath="/catalog"
              />
            }
          />
        </Suspense>
        <div>
          <Suspense fallback={null}>
            <CatalogActiveFilters brands={brands} stores={stores} />
          </Suspense>
          <Suspense fallback={null}>
            <CatalogProductListing
              initialResult={result}
              emptyMessage="По выбранным фильтрам ничего не найдено."
            />
          </Suspense>
        </div>
      </div>
      <RecentlyViewedSection />
    </div>
  );
}
