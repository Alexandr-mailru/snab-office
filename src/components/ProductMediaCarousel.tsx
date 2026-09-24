"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { productGradient } from "@/lib/gradients";

type ProductMediaCarouselProps = {
  name: string;
  href: string;
  images: string[];
  imageHint?: string | null;
  variant?: "card" | "list";
  badges?: ReactNode;
};

export function ProductMediaCarousel({
  name,
  href,
  images,
  imageHint,
  variant = "card",
  badges,
}: ProductMediaCarouselProps) {
  const photos = images.filter(Boolean);
  const multi = photos.length > 1;
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    if (!track || !photos.length) return;
    const clamped = ((next % photos.length) + photos.length) % photos.length;
    const width = track.clientWidth || 1;
    track.scrollTo({ left: clamped * width, behavior: "smooth" });
    setIndex(clamped);
  }, [photos.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !multi) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const el = trackRef.current;
        if (!el) return;
        const slideWidth = el.clientWidth || 1;
        const i = Math.round(el.scrollLeft / slideWidth);
        setIndex(Math.min(Math.max(i, 0), photos.length - 1));
      });
    }

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [multi, photos.length]);

  if (!photos.length) {
    return (
      <div className={`product-carousel product-carousel--${variant}`}>
        <div className="product-carousel-viewport">
          <Link href={href} className="product-carousel-slide" aria-label={name}>
            <span
              className="product-swatch"
              style={{ background: productGradient(imageHint) }}
              aria-hidden
            />
          </Link>
          {badges}
        </div>
      </div>
    );
  }

  return (
    <div className={`product-carousel product-carousel--${variant}`}>
      <div className="product-carousel-viewport">
        {multi ? (
          <>
            <button
              type="button"
              className="product-carousel-nav product-carousel-prev"
              aria-label="Предыдущее фото"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(index - 1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="product-carousel-nav product-carousel-next"
              aria-label="Следующее фото"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(index + 1);
              }}
            >
              ›
            </button>
          </>
        ) : null}

        <div
          ref={trackRef}
          className="product-carousel-track"
          tabIndex={multi ? 0 : undefined}
          role={multi ? "region" : undefined}
          aria-roledescription={multi ? "карусель" : undefined}
          aria-label={multi ? `Фотографии: ${name}` : undefined}
          onKeyDown={
            multi
              ? (e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    goTo(index + 1);
                  }
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    goTo(index - 1);
                  }
                }
              : undefined
          }
        >
          {photos.map((src, i) => (
            <Link
              key={`${src}-${i}`}
              href={href}
              className="product-carousel-slide"
              tabIndex={-1}
              draggable={false}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={i === 0 ? name : `${name} — фото ${i + 1}`}
                className="product-image"
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </Link>
          ))}
        </div>

        {badges}
        {multi ? (
          <div className="product-carousel-meta" aria-hidden>
            <span className="product-carousel-counter">
              {index + 1}/{photos.length}
            </span>
            <div className="product-carousel-dots">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`product-carousel-dot ${i === index ? "is-active" : ""}`}
                  aria-label={`Фото ${i + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(i);
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {variant === "list" && multi ? (
        <div className="product-carousel-thumbs" role="tablist" aria-label="Миниатюры">
          {photos.map((src, i) => (
            <button
              key={`${src}-thumb-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`product-carousel-thumb ${i === index ? "is-active" : ""}`}
              onClick={() => goTo(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
