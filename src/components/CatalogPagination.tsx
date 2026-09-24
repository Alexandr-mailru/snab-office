"use client";

type Props = {
  total: number;
  page: number;
  perPage: number;
  /** Visual placement — pagination can be shown top and bottom. */
  position?: "top" | "bottom";
  onGoToPage: (page: number) => void;
};

function pageNumbers(current: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (current < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export function CatalogPagination({
  total,
  page,
  perPage,
  position = "bottom",
  onGoToPage,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, perPage)));

  if (totalPages <= 1) return null;

  const pages = pageNumbers(page, totalPages);
  const safePage = Math.min(Math.max(1, page), totalPages);

  return (
    <nav
      className={`catalog-pagination catalog-pagination--${position}`}
      aria-label={position === "top" ? "Страницы каталога (верх)" : "Страницы каталога"}
    >
      {safePage > 1 ? (
        <button type="button" className="catalog-page-btn" onClick={() => onGoToPage(safePage - 1)}>
          ← Назад
        </button>
      ) : (
        <span className="catalog-page-btn is-disabled" aria-hidden>
          ← Назад
        </span>
      )}

      <div className="catalog-page-list">
        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="catalog-page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`catalog-page-num ${p === safePage ? "is-active" : ""}`}
              aria-current={p === safePage ? "page" : undefined}
              onClick={() => onGoToPage(p)}
            >
              {p}
            </button>
          ),
        )}
      </div>

      {safePage < totalPages ? (
        <button type="button" className="catalog-page-btn" onClick={() => onGoToPage(safePage + 1)}>
          Вперёд →
        </button>
      ) : (
        <span className="catalog-page-btn is-disabled" aria-hidden>
          Вперёд →
        </span>
      )}
    </nav>
  );
}
