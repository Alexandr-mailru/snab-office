import Link from "next/link";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { NewsShowcase } from "@/components/NewsShowcase";
import { ProductCard } from "@/components/ProductCard";
import { StoreCard } from "@/components/StoreCard";
import { HOME_CAROUSEL_SLIDES } from "@/lib/homeCarousel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let news: Awaited<ReturnType<typeof prisma.news.findMany>> = [];
  let stores: Awaited<ReturnType<typeof prisma.store.findMany>> = [];
  let novinki: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let sale: Awaited<ReturnType<typeof prisma.product.findMany>> = [];

  try {
    [featured, news, stores, novinki, sale] = await Promise.all([
      prisma.product.findMany({
        where: { featured: true, active: true },
        orderBy: { name: "asc" },
        take: 8,
      }),
      prisma.news.findMany({ orderBy: { publishedAt: "desc" }, take: 4 }),
      prisma.store.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.product.findMany({
        where: { isNew: true, active: true },
        orderBy: { name: "asc" },
        take: 4,
      }),
      prisma.product.findMany({
        where: { onSale: true, active: true },
        orderBy: { name: "asc" },
        take: 4,
      }),
    ]);
  } catch {
    // Local/remote DB outage should not blank the whole homepage shell.
  }

  return (
    <>
      <section className="hero">
        <div className="hero-stage">
          <div className="hero-copy">
            <img
              src="/brand/logo.svg"
              alt="Торговый дом СнабОфис"
              className="logo-hero"
              width={520}
              height={95}
            />
            <h1 className="hero-title">Всё для офиса, школы и творчества</h1>
            <p>
              Канцелярия, техника и товары для кондитеров — в двух магазинах Москвы и
              онлайн. Для компаний и учреждений — заказ с договором и менеджером.
            </p>
            <div className="hero-actions">
              <Link href="/catalog" className="btn btn-primary">
                Открыть каталог
              </Link>
              <Link href="/corporate" className="btn btn-secondary">
                Для организаций
              </Link>
            </div>
          </div>
          <NewsShowcase items={news} compact />
        </div>
      </section>

      <section className="section section-home-carousel">
        <CategoryCarousel items={HOME_CAROUSEL_SLIDES} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Новинки</h2>
          <Link href="/catalog?filter=new">Все новинки</Link>
        </div>
        <div className="product-grid">
          {novinki.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Распродажа</h2>
          <Link href="/catalog?filter=sale">Все акции</Link>
        </div>
        <div className="product-grid">
          {sale.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Популярное</h2>
          <Link href="/catalog">Смотреть все</Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Наши магазины</h2>
        </div>
        <div
          className="split-band stores-home-band"
        >
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} variant="home" />
          ))}
        </div>
      </section>
    </>
  );
}
