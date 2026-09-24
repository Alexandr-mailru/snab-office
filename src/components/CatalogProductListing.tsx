"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CatalogLoadMore, type LoadMoreSync } from "@/components/CatalogLoadMore";
import { CatalogPagination } from "@/components/CatalogPagination";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { parseCatalogParams, type ProductSearchResult } from "@/lib/catalog";
import { buildFilterParams, readLiveSearchParams } from "@/lib/catalog-url";

type Props = {
  initialResult: ProductSearchResult;
  categorySlug?: string;
  brandSlug?: string;
  emptyMessage?: string;
};

function buildApiQueryString(
  queryString: string,
  categorySlug?: string,
  brandSlug?: string,
) {
  const params = new URLSearchParams(queryString);
  if (categorySlug) params.set("category", categorySlug);
  if (brandSlug) {
    params.delete("brands");
    params.set("brand", brandSlug);
  }
  return params.toString();
}

/** Filters only — page changes remount the grid separately so previous pages never linger. */
function listingIdentity(queryString: string, categorySlug?: string, brandSlug?: string) {
  const p = new URLSearchParams(queryString);
  p.delete("page");
  p.delete("perPage");
  return `${categorySlug ?? ""}|${brandSlug ?? ""}|${p.toString()}`;
}

function readPageParam(qs: string) {
  return new URLSearchParams(qs).get("page") || "1";
}

export function CatalogProductListing({
  initialResult,
  categorySlug,
  brandSlug,
  emptyMessage = "По выбранным фильтрам ничего не найдено.",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const listKey = useMemo(
    () => listingIdentity(queryString, categorySlug, brandSlug),
    [queryString, categorySlug, brandSlug],
  );

  const parsed = parseCatalogParams(Object.fromEntries(searchParams.entries()));
  const { view, sort, storeSlug, page: urlPage, perPage: urlPerPage } = parsed;

  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialResult.items.length);
  const [rangeFrom, setRangeFrom] = useState(
    (initialResult.page - 1) * initialResult.perPage + 1,
  );
  const [displayPerPage, setDisplayPerPage] = useState(initialResult.perPage);

  const apiQueryString = useMemo(
    () => buildApiQueryString(queryString, categorySlug, brandSlug),
    [queryString, categorySlug, brandSlug],
  );

  const skipFirstFetchRef = useRef(true);
  const requestIdRef = useRef(0);
  const skipPerPageOnlyRef = useRef(false);
  const prevApiQueryRef = useRef(apiQueryString);
  const listTopRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const scrollToListTop = useCallback(() => {
    const el = listTopRef.current;
    if (!el) return;
    const header = document.querySelector<HTMLElement>(".site-header");
    const offset = header ? Math.round(header.getBoundingClientRect().height) + 8 : 72;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  useEffect(() => {
    function onScroll() {
      const el = listTopRef.current;
      if (!el) {
        setShowBackToTop(false);
        return;
      }
      setShowBackToTop(el.getBoundingClientRect().top < -280);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (skipFirstFetchRef.current) {
      skipFirstFetchRef.current = false;
      prevApiQueryRef.current = apiQueryString;
      return;
    }

    const prevQuery = prevApiQueryRef.current;
    prevApiQueryRef.current = apiQueryString;
    const pageChanged = readPageParam(prevQuery) !== readPageParam(apiQueryString);

    if (skipPerPageOnlyRef.current) {
      skipPerPageOnlyRef.current = false;
      if (!pageChanged) return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    fetch(`/api/catalog?${apiQueryString}`)
      .then((r) => {
        if (!r.ok) throw new Error("catalog fetch failed");
        return r.json() as Promise<ProductSearchResult>;
      })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        // Replace window only — never merge with a previous page.
        setResult(data);
        setVisibleCount(data.items.length);
        setRangeFrom((data.page - 1) * data.perPage + 1);
        setDisplayPerPage(data.perPage);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setResult({ items: [], total: 0, page: 1, perPage: urlPerPage });
        setVisibleCount(0);
        setRangeFrom(1);
        setDisplayPerPage(urlPerPage);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [apiQueryString, urlPerPage]);

  const onLoadMoreSync = useCallback((sync: LoadMoreSync) => {
    setVisibleCount(sync.count);
    setRangeFrom(sync.from);
    setDisplayPerPage(sync.perPage);
    if (sync.skipFetch) skipPerPageOnlyRef.current = true;
    setResult((prev) =>
      prev.perPage === sync.perPage && prev.page === (sync.from === 1 ? 1 : prev.page)
        ? prev
        : { ...prev, perPage: sync.perPage, page: sync.from === 1 ? 1 : prev.page },
    );
  }, []);

  const goToPage = useCallback(
    (target: number) => {
      if (target === urlPage) {
        scrollToListTop();
        return;
      }

      // Pagination = jump to a slice. Drop current items immediately so page 1
      // products never stay visible under page 2 / 3.
      skipPerPageOnlyRef.current = false;
      const perPageWrite = urlPerPage;
      setLoading(true);
      setResult((prev) => ({
        ...prev,
        items: [],
        page: target,
        perPage: perPageWrite,
      }));
      setVisibleCount(0);
      setRangeFrom((target - 1) * perPageWrite + 1);
      setDisplayPerPage(perPageWrite);
      scrollToListTop();

      const next = buildFilterParams(
        readLiveSearchParams(searchParams),
        {
          page: target <= 1 ? null : String(target),
          perPage: String(perPageWrite),
        },
        false,
      );
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, scrollToListTop, searchParams, urlPage, urlPerPage],
  );

  const { total } = result;
  // Toolbar may show a larger "N на стр." after «Показать ещё», but page links
  // stay tied to the URL page size so page 3 never means "products from 1+".
  const paginationPerPage = urlPerPage;
  const effectivePerPage = displayPerPage;
  const paginationPage = urlPage;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, paginationPerPage)));
  const showPagination = totalPages > 1;
  const showProducts = result.items.length > 0;
  const showEmpty = !loading && result.items.length === 0;

  return (
    <div className={`catalog-listing ${loading ? "is-loading" : ""}`}>
      <div ref={listTopRef} className="catalog-list-top" />

      <CatalogToolbar
        total={total}
        page={paginationPage}
        perPage={effectivePerPage}
        view={view}
        sort={sort}
        shownFrom={rangeFrom}
        shownCount={visibleCount}
      />

      {showPagination ? (
        <CatalogPagination
          total={total}
          page={paginationPage}
          perPage={paginationPerPage}
          position="top"
          onGoToPage={goToPage}
        />
      ) : null}

      {loading ? <p className="catalog-loading muted">Обновляем результаты…</p> : null}

      {showProducts ? (
        <CatalogLoadMore
          key={`${listKey}|page-${urlPage}`}
          initial={result}
          view={view}
          queryString={apiQueryString}
          storeSlug={storeSlug}
          onLoadMoreSync={onLoadMoreSync}
        />
      ) : null}

      {showEmpty ? <div className="empty-state panel">{emptyMessage}</div> : null}

      {showPagination ? (
        <CatalogPagination
          total={total}
          page={paginationPage}
          perPage={paginationPerPage}
          position="bottom"
          onGoToPage={goToPage}
        />
      ) : null}

      {showProducts ? (
        <div className="catalog-back-to-top-row">
          <button type="button" className="btn btn-secondary catalog-back-to-top-inline" onClick={scrollToListTop}>
            ↑ В начало списка
          </button>
        </div>
      ) : null}

      {showBackToTop ? (
        <button
          type="button"
          className="catalog-back-to-top-fab"
          onClick={scrollToListTop}
          aria-label="В начало списка"
        >
          <span aria-hidden>↑</span>
          <span className="catalog-back-to-top-fab-label">Наверх</span>
        </button>
      ) : null}
    </div>
  );
}
