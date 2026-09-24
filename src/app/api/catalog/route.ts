import { NextResponse } from "next/server";
import { parseCatalogParams, searchProducts } from "@/lib/catalog";

/** Public catalog payload — omit internal ids / sync metadata. */
function toPublicCatalogItem(
  item: Awaited<ReturnType<typeof searchProducts>>["items"][number],
) {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    price: item.price,
    oldPrice: item.oldPrice,
    stock: item.stock,
    unit: item.unit,
    brandName: item.brandName,
    imageUrl: item.imageUrl,
    images: item.images,
    imageHint: item.imageHint,
    featured: item.featured,
    isNew: item.isNew,
    onSale: item.onSale,
    format: item.format,
    color: item.color,
    ratingAvg: item.ratingAvg,
    ratingCount: item.ratingCount,
    brand: item.brand
      ? { slug: item.brand.slug, name: item.brand.name }
      : null,
    category: item.category
      ? { slug: item.category.slug, name: item.category.name }
      : null,
    storeStocks: (item.storeStocks ?? []).map((row) => ({
      stock: row.stock,
      store: { slug: row.store.slug, name: row.store.name },
    })),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const { view: _view, ...params } = parseCatalogParams(raw);
  const categorySlug = url.searchParams.get("category") || undefined;
  const result = await searchProducts({ ...params, categorySlug });

  return NextResponse.json({
    items: result.items.map(toPublicCatalogItem),
    total: result.total,
    page: result.page,
    perPage: result.perPage,
  });
}
