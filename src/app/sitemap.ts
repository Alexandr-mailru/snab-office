import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const [products, categories, brands, news] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.brand.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.news.findMany({ select: { slug: true, publishedAt: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/catalog",
    "/brands",
    "/stores",
    "/news",
    "/about",
    "/corporate",
    "/delivery",
    "/returns",
    "/offer",
    "/feedback",
    "/vacancies",
    "/privacy",
    "/policy/agreement",
    "/checkout",
    "/account",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/catalog" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/catalog" ? 0.9 : 0.6,
  }));

  return [
    ...staticRoutes,
    ...categories.map((c) => ({
      url: `${base}/catalog/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...brands.map((b) => ({
      url: `${base}/brands/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...news.map((n) => ({
      url: `${base}/news/${n.slug}`,
      lastModified: n.updatedAt ?? n.publishedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
