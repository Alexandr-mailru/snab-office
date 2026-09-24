"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  tone: string;
};

export function Showcase({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [banners.length]);

  if (!banners.length) return null;
  const current = banners[index];

  return (
    <section className="showcase">
      <div className="showcase-stage">
        {banners.map((banner, i) => (
          <Link
            key={banner.id}
            href={banner.href}
            className={`showcase-slide tone-${banner.tone} ${i === index ? "is-active" : ""}`}
            aria-hidden={i !== index}
          >
            <span className="eyebrow">Витрина СнабОфис</span>
            <strong>{banner.title}</strong>
            {banner.subtitle ? <p>{banner.subtitle}</p> : null}
            <span className="btn btn-primary"> Смотреть</span>
          </Link>
        ))}
      </div>
      <div className="showcase-dots" role="tablist" aria-label="Баннеры">
        {banners.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            className={i === index ? "is-active" : undefined}
            aria-label={banner.title}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
      <p className="visually-hidden">{current.title}</p>
    </section>
  );
}
