import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JsonLd } from "@/components/JsonLd";
import { ProductGallery } from "@/components/ProductGallery";
import { RecentlyViewedTracker } from "@/components/RecentlyViewedTracker";
import { ReviewForm } from "@/components/ReviewForm";
import { VariantSwitcher } from "@/components/VariantSwitcher";
import { resolveProductImage } from "@/lib/productImages";
import { formatDate, formatPrice } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REVIEW_STATUS } from "@/lib/reviews";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function parseImages(raw: string | null | undefined, fallback: string | null): string[] {
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Товар" };
  const description = product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      storeStocks: { include: { store: { select: { name: true, slug: true } } } },
      reviews: {
        where: { status: REVIEW_STATUS.APPROVED },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!product) notFound();

  const user = await getSessionUser();
  const [favorite, variants, myReview] = await Promise.all([
    user
      ? prisma.favorite.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        })
      : Promise.resolve(null),
    product.variantGroup
      ? prisma.product.findMany({
          where: { variantGroup: product.variantGroup, active: true },
          select: {
            slug: true,
            variantLabel: true,
            stock: true,
            imageUrl: true,
          },
          orderBy: { variantLabel: "asc" },
        })
      : Promise.resolve([]),
    user
      ? prisma.review.findUnique({
          where: { productId_userId: { productId: product.id, userId: user.id } },
        })
      : Promise.resolve(null),
  ]);

  const images = parseImages(product.images, resolveProductImage(product));
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const productUrl = `${site}/product/${product.slug}`;
  const image = images[0] ? (images[0].startsWith("http") ? images[0] : `${site}${images[0]}`) : undefined;

  return (
    <div className="page-shell">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.sku || undefined,
          brand: product.brandName
            ? { "@type": "Brand", name: product.brandName }
            : undefined,
          image: image ? [image] : undefined,
          url: productUrl,
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "RUB",
            price: product.price,
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
          ...(product.ratingCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.ratingAvg,
                  reviewCount: product.ratingCount,
                },
              }
            : {}),
        }}
      />
      <RecentlyViewedTracker
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          ...(product.category.parent
            ? [{ label: product.category.parent.name, href: `/catalog/${product.category.parent.slug}` }]
            : []),
          { label: product.category.name, href: `/catalog/${product.category.slug}` },
          { label: product.name },
        ]}
      />
      <div className="page-header">
        <p className="eyebrow">
          <Link href={`/catalog/${product.category.slug}`}>{product.category.name}</Link>
        </p>
      </div>

      <div className="product-layout layout-full">
        <ProductGallery name={product.name} images={images} />

        <div className="product-info panel">
          {product.brandName ? <p className="muted">{product.brandName}</p> : null}
          <h1>{product.name}</h1>
          {product.ratingCount > 0 ? (
            <p className="rating-line">
              ★ {product.ratingAvg.toFixed(1)} · {product.ratingCount} отзыв
              {product.ratingCount === 1 ? "" : product.ratingCount < 5 ? "а" : "ов"}
            </p>
          ) : (
            <p className="rating-line muted">Пока нет отзывов</p>
          )}
          <div className="price-row price-row-lg">
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice ? <s>{formatPrice(product.oldPrice)}</s> : null}
          </div>

          <VariantSwitcher currentSlug={product.slug} variants={variants} />

          <div className="product-description">
            <h2 className="product-desc-title">Описание</h2>
            <p>{product.description}</p>
          </div>
          <div className="product-actions-row">
            <AddToCartButton product={product} />
            <FavoriteButton productId={product.id} initial={!!favorite} />
          </div>
          <p className="qty-note">
            Артикул: {product.sku ?? "—"} · Остаток: {product.stock} {product.unit}
            {product.externalId ? ` · ID 1С: ${product.externalId}` : null}
          </p>
          {product.storeStocks.length ? (
            <ul className="store-stock-list">
              {product.storeStocks.map((row) => (
                <li key={row.store.slug}>
                  {row.store.name}: <strong>{row.stock}</strong> {product.unit}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <section className="reviews-section">
        <h2>Отзывы</h2>
        <div className="reviews-layout">
          <div className="reviews-list">
            {product.reviews.length ? (
              product.reviews.map((review) => (
                <article key={review.id} className="review-card panel">
                  <p className="review-meta">
                    <strong>{review.user.name}</strong> · {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)} · {formatDate(review.createdAt)}
                  </p>
                  <p>{review.body}</p>
                </article>
              ))
            ) : (
              <p className="muted">Станьте первым, кто оценит этот товар.</p>
            )}
          </div>
          <div className="panel">
            {user ? (
              myReview?.status === REVIEW_STATUS.APPROVED ? (
                <p className="muted">Ваш отзыв опубликован. Спасибо!</p>
              ) : myReview?.status === REVIEW_STATUS.PENDING ? (
                <p className="muted">
                  Ваш отзыв на модерации. После проверки он появится на странице товара.
                </p>
              ) : myReview?.status === REVIEW_STATUS.REJECTED ? (
                <>
                  <p className="muted text-gap-sm">
                    Предыдущий отзыв отклонён. Можно отправить новый текст.
                  </p>
                  <ReviewForm productId={product.id} />
                </>
              ) : (
                <ReviewForm productId={product.id} />
              )
            ) : (
              <p>
                Чтобы оставить отзыв, <Link href="/account">войдите в кабинет</Link>.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
