import type { MetadataRoute } from "next";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  let host: string | undefined;
  try {
    host = new URL(base).host;
  } catch {
    host = undefined;
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/account/cabinet", "/cart", "/checkout"],
    },
    sitemap: `${base}/sitemap.xml`,
    host,
  };
}
