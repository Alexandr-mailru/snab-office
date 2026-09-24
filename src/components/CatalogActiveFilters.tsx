"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FilterBrand } from "@/components/CatalogFiltersPanel";
import { parseListParam, readLiveSearchParams } from "@/lib/catalog-url";

const FILTER_LABELS: Record<string, string> = {
  new: "Новинки",
  sale: "Распродажа",
};

type Props = {
  brands: FilterBrand[];
  stores?: { slug: string; name: string }[];
  basePath?: string;
};

function removeParam(params: URLSearchParams, key: string, value?: string) {
  if (value === undefined) {
    params.delete(key);
    return;
  }
  const list = parseListParam(params.get(key)).filter((s) => s !== value);
  if (list.length) params.set(key, list.join(","));
  else params.delete(key);
}

export function CatalogActiveFilters({ brands, stores = [], basePath }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const path = basePath ?? pathname;

  function navigate(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  }

  function currentParams() {
    return readLiveSearchParams(searchParams);
  }

  const chips: { key: string; label: string; value?: string }[] = [];

  const filter = searchParams.get("filter");
  if (filter === "new" || filter === "sale") {
    chips.push({ key: "filter", label: FILTER_LABELS[filter] });
  }

  const brandSlugs = parseListParam(searchParams.get("brands") || searchParams.get("brand"));
  for (const slug of brandSlugs) {
    const brand = brands.find((b) => b.slug === slug);
    chips.push({ key: "brands", label: brand?.name ?? slug, value: slug });
  }

  const colors = parseListParam(searchParams.get("colors"));
  for (const color of colors) {
    chips.push({ key: "colors", label: `Цвет: ${color}`, value: color });
  }

  const formats = parseListParam(searchParams.get("formats"));
  for (const format of formats) {
    chips.push({ key: "formats", label: `Формат: ${format}`, value: format });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    chips.push({
      key: "price",
      label: `Цена: ${minPrice || "0"}–${maxPrice || "∞"} ₽`,
    });
  }

  if (searchParams.get("inStock") === "1") {
    chips.push({ key: "inStock", label: "В наличии" });
  }

  const store = searchParams.get("store");
  if (store) {
    const row = stores.find((s) => s.slug === store);
    chips.push({ key: "store", label: row?.name ?? store });
  }

  const q = searchParams.get("q");
  if (q) chips.push({ key: "q", label: `Поиск: ${q}` });

  if (!chips.length) return null;

  function removeChip(chip: { key: string; value?: string }) {
    const next = currentParams();
    if (chip.key === "price") {
      next.delete("minPrice");
      next.delete("maxPrice");
    } else if (chip.key === "brands" && chip.value) {
      removeParam(next, "brands", chip.value);
      next.delete("brand");
    } else if (chip.value) {
      removeParam(next, chip.key, chip.value);
    } else {
      next.delete(chip.key);
    }
    next.delete("page");
    navigate(next);
  }

  function clearAll() {
    const live = currentParams();
    const next = new URLSearchParams();
    for (const key of ["perPage", "sort", "view", "q"] as const) {
      const v = live.get(key);
      if (v) next.set(key, v);
    }
    navigate(next);
  }

  return (
    <div className="catalog-active-filters">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value ?? chip.label}`}
          type="button"
          className="filter-chip"
          onClick={() => removeChip(chip)}
        >
          {chip.label} <span aria-hidden>×</span>
        </button>
      ))}
      <button type="button" className="filter-chip filter-chip-clear" onClick={clearAll}>
        Сбросить всё
      </button>
    </div>
  );
}
