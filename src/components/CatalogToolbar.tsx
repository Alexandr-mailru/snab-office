"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PER_PAGE_OPTIONS, type CatalogView, type ProductSort } from "@/lib/catalog";
import { buildFilterParams, readLiveSearchParams } from "@/lib/catalog-url";

type Props = {
  total: number;
  page: number;
  perPage: number;
  view: CatalogView;
  sort: ProductSort;
  /** 1-based index of first shown product (after «Показать ещё»). */
  shownFrom?: number;
  /** Actual rendered item count. */
  shownCount?: number;
};

export function CatalogToolbar({
  total,
  page,
  perPage,
  view,
  sort,
  shownFrom,
  shownCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function replace(updates: Record<string, string | null>, resetPage = false) {
    const next = buildFilterParams(readLiveSearchParams(searchParams), updates, resetPage);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const from =
    total === 0 ? 0 : shownFrom != null ? shownFrom : (page - 1) * perPage + 1;
  const to =
    total === 0
      ? 0
      : Math.min(
          shownCount != null ? from + shownCount - 1 : page * perPage,
          total,
        );
  const selectPerPage = PER_PAGE_OPTIONS.includes(perPage as (typeof PER_PAGE_OPTIONS)[number])
    ? perPage
    : (PER_PAGE_OPTIONS.find((n) => n >= perPage) ?? PER_PAGE_OPTIONS[PER_PAGE_OPTIONS.length - 1]);

  return (
    <div className="catalog-toolbar">
      <p className="catalog-toolbar-count muted">
        {total ? (
          <>
            Показано {from}–{to} из {total}
          </>
        ) : (
          "Ничего не найдено"
        )}
      </p>

      <div className="catalog-toolbar-controls">
        <label className="catalog-toolbar-field">
          <span className="sr-only">Сортировка</span>
          <select
            value={sort}
            onChange={(e) => replace({ sort: e.target.value === "featured" ? null : e.target.value }, true)}
            aria-label="Сортировка"
          >
            <option value="featured">По умолчанию</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
            <option value="name">По названию</option>
            <option value="newest">Сначала новые</option>
          </select>
        </label>

        <label className="catalog-toolbar-field">
          <span className="sr-only">На странице</span>
          <select
            value={String(selectPerPage)}
            onChange={(e) => replace({ perPage: e.target.value }, true)}
            aria-label="Товаров на странице"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} на стр.
              </option>
            ))}
          </select>
        </label>

        <div className="catalog-view-toggle" role="group" aria-label="Вид каталога">
          <button
            type="button"
            className={`catalog-view-btn ${view === "grid" ? "is-active" : ""}`}
            onClick={() => replace({ view: null })}
            aria-pressed={view === "grid"}
            title="Карточки"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <rect x="1" y="1" width="7" height="7" rx="1" fill="currentColor" />
              <rect x="10" y="1" width="7" height="7" rx="1" fill="currentColor" />
              <rect x="1" y="10" width="7" height="7" rx="1" fill="currentColor" />
              <rect x="10" y="10" width="7" height="7" rx="1" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className={`catalog-view-btn ${view === "list" ? "is-active" : ""}`}
            onClick={() => replace({ view: "list" })}
            aria-pressed={view === "list"}
            title="Список"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <rect x="1" y="2" width="5" height="5" rx="1" fill="currentColor" />
              <rect x="8" y="3" width="9" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="8" y="6" width="7" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="1" y="11" width="5" height="5" rx="1" fill="currentColor" />
              <rect x="8" y="12" width="9" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="8" y="15" width="7" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
