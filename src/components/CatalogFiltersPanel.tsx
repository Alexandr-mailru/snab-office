"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PriceRangeSlider } from "@/components/PriceRangeSlider";
import { useCatalogNavigate } from "@/hooks/useCatalogNavigate";
import { parseListParam, toggleListParam } from "@/lib/catalog-url";

export type FilterBrand = { slug: string; name: string; count?: number };
export type FilterFacetValue = { value: string; count: number };

type Props = {
  brands: FilterBrand[];
  stores?: { slug: string; name: string }[];
  facets?: { colors: FilterFacetValue[]; formats: FilterFacetValue[] };
  priceBounds?: { min: number; max: number };
  basePath?: string;
};

export function CatalogFiltersPanel({
  brands,
  stores = [],
  facets = { colors: [], formats: [] },
  priceBounds = { min: 0, max: 10000 },
  basePath = "/catalog",
}: Props) {
  const searchParams = useSearchParams();
  const { replaceParams } = useCatalogNavigate(basePath);

  const filter = searchParams.get("filter") || "all";
  const store = searchParams.get("store") || "";
  const selectedBrands = parseListParam(searchParams.get("brands") || searchParams.get("brand"));
  const selectedColors = parseListParam(searchParams.get("colors"));
  const selectedFormats = parseListParam(searchParams.get("formats"));
  const inStock = searchParams.get("inStock") === "1";

  const urlMin = Number(searchParams.get("minPrice"));
  const urlMax = Number(searchParams.get("maxPrice"));
  const committedMin = Number.isFinite(urlMin) && urlMin > 0 ? urlMin : priceBounds.min;
  const committedMax = Number.isFinite(urlMax) && urlMax > 0 ? urlMax : priceBounds.max;

  const [minPrice, setMinPrice] = useState(committedMin);
  const [maxPrice, setMaxPrice] = useState(committedMax);
  const [syncedCommitted, setSyncedCommitted] = useState({ min: committedMin, max: committedMax });
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (syncedCommitted.min !== committedMin || syncedCommitted.max !== committedMax) {
    setSyncedCommitted({ min: committedMin, max: committedMax });
    setMinPrice(committedMin);
    setMaxPrice(committedMax);
  }

  const priceDirty = minPrice !== committedMin || maxPrice !== committedMax;
  const priceFiltered =
    (Number.isFinite(urlMin) && urlMin > priceBounds.min) ||
    (Number.isFinite(urlMax) && urlMax > 0 && urlMax < priceBounds.max);

  useEffect(() => {
    if (!priceDirty) return;
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      replaceParams({
        minPrice: minPrice > priceBounds.min ? String(minPrice) : null,
        maxPrice: maxPrice < priceBounds.max ? String(maxPrice) : null,
      });
    }, 350);
    return () => {
      if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    };
  }, [minPrice, maxPrice, priceDirty, priceBounds.min, priceBounds.max, replaceParams]);

  function reset() {
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
    replaceParams({
      filter: null,
      brands: null,
      brand: null,
      colors: null,
      formats: null,
      minPrice: null,
      maxPrice: null,
      inStock: null,
      store: null,
    });
  }

  const brandList = useMemo(() => brands.slice(0, 12), [brands]);

  return (
    <div className="filter-form">
      <label>
        Подборка
        <select
          value={filter}
          onChange={(e) => {
            const value = e.target.value;
            replaceParams({ filter: value === "all" ? null : value });
          }}
        >
          <option value="all">Все товары</option>
          <option value="new">Новинки</option>
          <option value="sale">Распродажа</option>
        </select>
      </label>

      {stores.length ? (
        <label>
          Магазин
          <select
            value={store}
            onChange={(e) => replaceParams({ store: e.target.value || null })}
          >
            <option value="">Все магазины</option>
            {stores.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <CollapsibleSection
        title="Бренды"
        defaultOpen={selectedBrands.length > 0}
        badge={selectedBrands.length || undefined}
        className="filter-collapse--nested"
      >
        <div className="filter-check-list">
          {brandList.map((b) => (
            <label key={b.slug} className="filter-check">
              <input
                type="checkbox"
                checked={selectedBrands.includes(b.slug)}
                onChange={(e) => {
                  const current = parseListParam(
                    searchParams.get("brands") || searchParams.get("brand"),
                  );
                  const next = toggleListParam(current, b.slug, e.target.checked);
                  replaceParams({
                    brands: next.length ? next.join(",") : null,
                    brand: null,
                  });
                }}
              />
              <span className="filter-check-label">
                {b.name}
                {typeof b.count === "number" ? (
                  <span className="filter-count"> · {b.count}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {facets.colors.length ? (
        <CollapsibleSection
          title="Цвет"
          defaultOpen={selectedColors.length > 0}
          badge={selectedColors.length || undefined}
          className="filter-collapse--nested"
        >
          <div className="filter-check-list">
            {facets.colors.map((color) => (
              <label key={color.value} className="filter-check">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color.value)}
                  onChange={(e) => {
                    const current = parseListParam(searchParams.get("colors"));
                    const next = toggleListParam(current, color.value, e.target.checked);
                    replaceParams({ colors: next.length ? next.join(",") : null });
                  }}
                />
                <span className="filter-check-label">
                  {color.value}
                  <span className="filter-count"> · {color.count}</span>
                </span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {facets.formats.length ? (
        <CollapsibleSection
          title="Формат"
          defaultOpen={selectedFormats.length > 0}
          badge={selectedFormats.length || undefined}
          className="filter-collapse--nested"
        >
          <div className="filter-check-list">
            {facets.formats.map((format) => (
              <label key={format.value} className="filter-check">
                <input
                  type="checkbox"
                  checked={selectedFormats.includes(format.value)}
                  onChange={(e) => {
                    const current = parseListParam(searchParams.get("formats"));
                    const next = toggleListParam(current, format.value, e.target.checked);
                    replaceParams({ formats: next.length ? next.join(",") : null });
                  }}
                />
                <span className="filter-check-label">
                  {format.value}
                  <span className="filter-count"> · {format.count}</span>
                </span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        title="Цена"
        defaultOpen={priceFiltered}
        className="filter-collapse--nested"
      >
        <PriceRangeSlider
          min={priceBounds.min}
          max={priceBounds.max}
          valueMin={minPrice}
          valueMax={maxPrice}
          onChange={(a, b) => {
            setMinPrice(a);
            setMaxPrice(b);
          }}
        />
      </CollapsibleSection>

      <label className="filter-check">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => replaceParams({ inStock: e.target.checked ? "1" : null })}
        />
        Только в наличии
      </label>

      <div className="filter-actions">
        <button type="button" className="btn btn-secondary" onClick={reset}>
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
}
