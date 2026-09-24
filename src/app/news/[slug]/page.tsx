import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageLightboxTrigger } from "@/components/ImageLightboxTrigger";
import { NewsArticleBody } from "@/components/NewsArticleBody";
import { NewsGallery } from "@/components/NewsGallery";
import { ProductCard } from "@/components/ProductCard";
import { formatDate } from "@/lib/format";
import { getSnabOfficeNewsBySlug } from "@/lib/shopNews";
import { getRelatedProductsForNews } from "@/lib/newsProducts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = await prisma.news.findUnique({ where: { slug } });
  return { title: item?.title ?? "Новость" };
}

export default async function NewsItemPage({ params }: Props) {
  const { slug } = await params;
  const item = await prisma.news.findUnique({ where: { slug } });
  if (!item) notFound();

  const seed = getSnabOfficeNewsBySlug(slug);
  const cover = seed?.coverImage || item.coverImage || null;
  const gallery = seed?.gallery?.length
    ? seed.gallery
    : cover
      ? [cover]
      : [];
  const paragraphs =
    seed?.paragraphs ??
    item.body
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

  const related = await getRelatedProductsForNews(slug, 10);
  const productsTitle = seed?.productsTitle ?? "Из каталога к материалу";
  const productsLead =
    seed?.productsLead ?? "Товары, которые продолжают тему этой новости.";

  return (
    <div className="page-shell page-shell-page news-article">
      <div className="page-header news-article-header">
        <p className="eyebrow">
          <Link href="/news">Новости СнабОфис</Link>
          <span aria-hidden> · </span>
          <time dateTime={new Date(item.publishedAt).toISOString().slice(0, 10)}>
            {formatDate(item.publishedAt)}
          </time>
        </p>
        <h1 className="page-title">{item.title}</h1>
        <p className="news-article-lead">{item.excerpt}</p>
      </div>

      {seed?.bannerImage ? (
        <ImageLightboxTrigger
          images={gallery.length ? gallery : [seed.bannerImage]}
          alt={item.title}
          className="news-article-banner news-article-banner--clickable"
        >
          <picture>
            {seed.bannerImageMobile ? (
              <source media="(max-width: 768px)" srcSet={seed.bannerImageMobile} />
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seed.bannerImage} alt={item.title} />
          </picture>
        </ImageLightboxTrigger>
      ) : null}

      {gallery.length ? (
        <NewsGallery
          images={gallery}
          title={seed?.galleryTitle ?? "Фотографии"}
          layout={seed?.collageLayout}
        />
      ) : cover && !seed?.bannerImage ? (
        <ImageLightboxTrigger images={[cover]} alt={item.title} className="news-detail-cover-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="news-detail-cover" />
        </ImageLightboxTrigger>
      ) : null}

      <NewsArticleBody paragraphs={paragraphs} />

      {related.length ? (
        <section className="news-related" aria-label="Товары по теме">
          <div className="news-related-head">
            <h2 className="news-section-title">{productsTitle}</h2>
            <p className="news-related-lead">{productsLead}</p>
          </div>
          <div className="product-grid news-related-grid">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
