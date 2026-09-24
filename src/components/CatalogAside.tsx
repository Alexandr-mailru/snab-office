"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CategoryTreeNav, type CategoryTreeNode } from "@/components/CategoryTreeNav";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FocusTrap } from "@/components/FocusTrap";

type CatalogAsideProps = {
  filters: ReactNode;
  categories: CategoryTreeNode[];
  activeCategorySlug?: string;
  filtersDefaultOpen?: boolean;
};

export function CatalogAside({
  filters,
  categories = [],
  activeCategorySlug,
  filtersDefaultOpen = false,
}: CatalogAsideProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("filters-drawer-open", open);
    document.documentElement.classList.toggle("filters-drawer-open", open);
    return () => {
      document.body.classList.remove("filters-drawer-open");
      document.documentElement.classList.remove("filters-drawer-open");
    };
  }, [open]);

  return (
    <div className={`catalog-aside-wrap ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="filters-mobile-toggle"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Фильтры и категории
      </button>
      {open ? (
        <button
          type="button"
          className="filters-backdrop"
          aria-label="Закрыть фильтры"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <FocusTrap active={open} onEscape={() => setOpen(false)}>
        <aside className={`filters ${open ? "is-drawer-open" : ""}`}>
          <div className="filters-drawer-head">
            <strong>Фильтры и категории</strong>
            <button type="button" className="drawer-close" onClick={() => setOpen(false)}>
              Готово
            </button>
          </div>
          <div className="filters-drawer-body">
            <CollapsibleSection title="Фильтры" defaultOpen={filtersDefaultOpen}>
              {filters}
            </CollapsibleSection>
            <section className="filter-categories-panel">
              <h2 className="filter-categories-title">Категории</h2>
              <CategoryTreeNav
                categories={categories}
                activeCategorySlug={activeCategorySlug}
                onNavigate={() => setOpen(false)}
                variant="sidebar"
              />
            </section>
          </div>
        </aside>
      </FocusTrap>
    </div>
  );
}
