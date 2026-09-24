import { prisma } from "@/lib/prisma";
import { getSnabOfficeNewsBySlug } from "@/lib/shopNews";

export async function getRelatedProductsForNews(slug: string, take = 10) {
  const seed = getSnabOfficeNewsBySlug(slug);
  const slugs = seed?.productSlugs ?? [];
  const hints = seed?.productHints ?? [];

  if (slugs.length) {
    const bySlug = await prisma.product.findMany({
      where: { active: true, slug: { in: slugs } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take,
    });
    if (bySlug.length) {
      // preserve productSlugs order
      const order = new Map(slugs.map((s, i) => [s, i]));
      bySlug.sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
      return bySlug.slice(0, take);
    }
  }

  if (hints.length) {
    const matched = await prisma.product.findMany({
      where: {
        active: true,
        OR: hints.map((hint) => ({ name: { contains: hint } })),
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take,
    });
    if (matched.length) return matched;
  }

  return prisma.product.findMany({
    where: { active: true, OR: [{ featured: true }, { isNew: true }] },
    orderBy: { name: "asc" },
    take,
  });
}
