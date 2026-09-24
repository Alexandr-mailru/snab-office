import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getSnabOfficeNewsBySlug } from "@/lib/shopNews";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новости" };

export default async function NewsPage() {
  const news = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow">Компания</p>
        <h1 className="page-title">Новости СнабОфис</h1>
      </div>
      <div className="news-grid news-grid--media page-shell-page">
        {news.map((item) => {
          const seed = getSnabOfficeNewsBySlug(item.slug);
          const cover = seed?.coverImage || item.coverImage || null;
          const text = seed?.excerpt || item.excerpt;
          return (
            <Link key={item.id} href={`/news/${item.slug}`} className="news-showcase-card">
              {cover ? (
                <div
                  className={`news-showcase-media${seed?.bannerImage ? " news-showcase-media--banner" : ""}`}
                  style={{ backgroundImage: `url("${cover}")` }}
                  role="img"
                  aria-label={item.title}
                />
              ) : (
                <div className="news-showcase-media news-showcase-media--empty" aria-hidden />
              )}
              <div className="news-showcase-body">
                <h3>{item.title}</h3>
                <p className="news-showcase-summary">{text}</p>
                <div className="news-showcase-foot">
                  <span className="news-showcase-meta">{formatDate(item.publishedAt)}</span>
                  <span className="news-showcase-more">Читать</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
