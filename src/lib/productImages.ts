export function resolveProductImage(
  product: { slug: string; imageUrl?: string | null },
): string | null {
  return product.imageUrl || null;
}

export function parseProductImages(
  raw: string | null | undefined,
  fallback: string | null,
): string[] {
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) {
      const list = parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
      if (list.length) return list;
    }
  } catch {
    /* ignore */
  }
  return fallback ? [fallback] : [];
}
