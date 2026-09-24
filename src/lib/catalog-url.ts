export function buildFilterParams(
  current: URLSearchParams,
  updates: Record<string, string | null>,
  resetPage = true,
) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  if (resetPage) next.delete("page");
  return next;
}

export function parseListParam(raw: string | null) {
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toggleListParam(list: string[], value: string, checked: boolean) {
  if (checked) return list.includes(value) ? list : [...list, value];
  return list.filter((x) => x !== value);
}

/** Prefer live browser URL so rapid filter clicks don't race stale useSearchParams. */
export function readLiveSearchParams(fallback: URLSearchParams) {
  if (typeof window === "undefined") return new URLSearchParams(fallback.toString());
  return new URLSearchParams(window.location.search);
}
