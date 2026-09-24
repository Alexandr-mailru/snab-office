import { Suspense } from "react";
import { CatalogActiveFilters } from "@/components/CatalogActiveFilters";
import { CatalogProductListing } from "@/components/CatalogProductListing";
import { parseCatalogParams, searchProducts } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = parseCatalogParams(await searchParams);
  return {
    title: q ? `Поиск: ${q}` : "Поиск",
    description: q
      ? `Результаты поиска «${q}» в каталоге «СнабОфис».`
      : "Поиск товаров в интернет-магазине СнабОфис.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const { view: _view, sort, storeSlug: _storeSlug, q, ...rest } = parseCatalogParams(raw);
  const query = q?.trim() ?? "";
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
    take: 80,
  });
  const stores = await prisma.store.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });
  const result = query
    ? await searchProducts({ ...rest, q: query, sort })
    : { items: [], total: 0, page: 1, perPage: rest.perPage ?? 24 };

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">Поиск</p>
        <h1 className="page-title">{query ? `Результаты: «${query}»` : "Поиск по каталогу"}</h1>
        <p className="lead">
          {query
            ? result.total
              ? `Найдено: ${result.total}`
              : "Ничего не найдено — попробуйте другой запрос"
            : "Введите запрос в строке поиска в шапке"}
        </p>
      </div>
      {query ? (
        <>
          <Suspense fallback={null}>
            <CatalogActiveFilters brands={brands} stores={stores} />
          </Suspense>
          <Suspense fallback={null}>
            <CatalogProductListing
              initialResult={result}
              emptyMessage="Ничего не найдено — попробуйте другой запрос."
            />
          </Suspense>
        </>
      ) : null}
    </div>
  );
}
