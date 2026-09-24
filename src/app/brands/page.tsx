import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Торговые марки" };

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const groups = new Map<string, typeof brands>();
  for (const brand of brands) {
    const letter = brand.name.charAt(0).toUpperCase();
    const key = /[A-ZА-ЯЁ]/i.test(letter) ? letter : "#";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(brand);
  }
  const letters = [...groups.keys()].sort((a, b) => a.localeCompare(b, "ru"));

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">Каталог</p>
        <h1 className="page-title">Торговые марки</h1>
        <p className="lead">
          {brands.length} торговых марок из ассортимента «СнабОфис».
        </p>
        <div className="brand-letters">
          {letters.map((letter) => (
            <a key={letter} href={`#letter-${letter}`}>
              {letter}
            </a>
          ))}
        </div>
      </div>

      {letters.map((letter) => (
        <section key={letter} id={`letter-${letter}`} className="brand-section">
          <h2>{letter}</h2>
          <div className="brand-grid">
            {groups.get(letter)!.map((brand) => (
              <Link key={brand.id} href={`/brands/${brand.slug}`} className="brand-chip">
                <strong>{brand.name}</strong>
                {brand._count.products > 0 ? (
                  <span className="muted">{brand._count.products}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
