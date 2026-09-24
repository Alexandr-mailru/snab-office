import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getSnabOfficeNewsBySlug } from "@/lib/shopNews";

export type NewsShowcaseItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: Date | string;
};

export function NewsShowcase({
  items,
  compact = false,
}: {
  items: NewsShowcaseItem[];
  /** Tighter cards for hero placement under the CTA */
  compact?: boolean;
}) {
  if (!items.length) return null;

  return (
    <section
      className={`news-showcase${compact ? " news-showcase--hero" : ""}`}
      aria-label="Новости компании"
    >
      <div className="news-showcase-head">
        <h2>Новости СнабОфис</h2>
        <Link href="/news">Все новости</Link>
      </div>
      <div className="news-showcase-grid">
        {items.map((item) => {
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
    </section>
  );
}
