"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildFilterParams, readLiveSearchParams } from "@/lib/catalog-url";

export function useCatalogNavigate(basePath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const path = basePath && basePath !== "auto" ? basePath : pathname;

  const replaceParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const current = readLiveSearchParams(searchParams);
      const next = buildFilterParams(current, updates, resetPage);
      const qs = next.toString();
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [path, router, searchParams],
  );

  return { path, searchParams, replaceParams };
}
