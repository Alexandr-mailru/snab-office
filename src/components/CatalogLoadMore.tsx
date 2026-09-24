"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductListRow } from "@/components/ProductListRow";
import {
  nextPerPageOption,
  type CatalogView,
  type ProductSearchResult,
} from "@/lib/catalog";
import { buildFilterParams, readLiveSearchParams } from "@/lib/catalog-url";

type ProductItem = ProductSearchResult["items"][number];

export type LoadMoreSync = {
  count: number;
  /** 1-based index of first visible product in the full result set */
  from: number;
  perPage: number;
  /** Parent must skip the next catalog refetch caused by perPage URL sync. */
  skipFetch?: boolean;
};

type Props = {
  initial: ProductSearchResult;
  view: CatalogView;
  queryString: string;
  storeSlug?: string;
  onLoadMoreSync?: (sync: LoadMoreSync) => void;
};

function filterKeyFromQuery(queryString: string) {
  const p = new URLSearchParams(queryString);
  p.delete("page");
  p.delete("perPage");
  return p.toString();
}

function resultDataKey(result: ProductSearchResult) {
  const first = result.items[0]?.id ?? "";
  const last = result.items[result.items.length - 1]?.id ?? "";
  return `${result.total}|${result.page}|${result.items.length}|${first}|${last}`;
}

export function CatalogLoadMore({
  initial,
  view,
  queryString,
  storeSlug,
  onLoadMoreSync,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ProductItem[]>(initial.items);
  const [loading, setLoading] = useState(false);
  /** Page size of the current pagination window (stable while appending). */
  const chunkSizeRef = useRef(initial.perPage);
  /** Catalog page where this listing window started (e.g. 3). */
  const basePageRef = useRef(initial.page);
  const displayPerPageRef = useRef(initial.perPage);
  const rangeFromRef = useRef((initial.page - 1) * initial.perPage + 1);
  const total = initial.total;
  const loadedEnd = rangeFromRef.current - 1 + items.length;
  const hasMore = loadedEnd < total;
  const filterKey = useMemo(() => filterKeyFromQuery(queryString), [queryString]);
  const dataKey = useMemo(() => resultDataKey(initial), [initial]);

  useEffect(() => {
    chunkSizeRef.current = initial.perPage;
    basePageRef.current = initial.page;
    displayPerPageRef.current = initial.perPage;
    rangeFromRef.current = (initial.page - 1) * initial.perPage + 1;
    setItems(initial.items);
    onLoadMoreSync?.({
      count: initial.items.length,
      from: rangeFromRef.current,
      perPage: initial.perPage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, dataKey]);

  async function loadMore() {
    if (loading) return;
    const chunk = chunkSizeRef.current;
    const end = rangeFromRef.current - 1 + items.length;
    if (end >= total) return;

    setLoading(true);
    // On page 3 with one screen loaded → fetch page 4; after that → page 5, etc.
    const pagesAlreadyShown = Math.max(1, Math.ceil(items.length / chunk));
    const nextPage = basePageRef.current + pagesAlreadyShown;

    const params = new URLSearchParams(queryString);
    params.set("page", String(nextPage));
    params.set("perPage", String(chunk));
    try {
      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as ProductSearchResult;

      const seen = new Set(items.map((p) => p.id));
      const appended = data.items.filter((p) => !seen.has(p.id));
      if (!appended.length) return;

      const unique = [...items, ...appended];
      setItems(unique);

      const bumped = nextPerPageOption(displayPerPageRef.current);
      const nextDisplay = bumped ?? Math.max(displayPerPageRef.current, unique.length);
      displayPerPageRef.current = nextDisplay;

      // Only sync larger perPage into the URL on page 1 (window starts at product 1).
      // On page 3+, keep URL page=3 so we never jump back to pages 1–2.
      if (bumped && basePageRef.current === 1) {
        const next = buildFilterParams(
          readLiveSearchParams(searchParams),
          { perPage: String(bumped) },
          true,
        );
        const qs = next.toString();
        onLoadMoreSync?.({
          count: unique.length,
          from: rangeFromRef.current,
          perPage: bumped,
          skipFetch: true,
        });
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      } else {
        onLoadMoreSync?.({
          count: unique.length,
          from: rangeFromRef.current,
          perPage: nextDisplay,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) return null;

  return (
    <>
      {view === "list" ? (
        <div className="product-list">
          {items.map((product) => (
            <ProductListRow key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      )}
      {hasMore ? (
        <div className="catalog-load-more-wrap">
          <button type="button" className="btn btn-secondary" disabled={loading} onClick={loadMore}>
            {loading ? "Загрузка…" : "Показать ещё"}
          </button>
        </div>
      ) : null}
    </>
  );
}
