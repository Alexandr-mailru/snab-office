"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeCarouselSlide } from "@/lib/homeCarousel";

const AUTOPLAY_MS = 4200;
const SWIPE_THRESHOLD_PX = 40;

export function CategoryCarousel({ items }: { items: HomeCarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const multi = items.length > 1;
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swiping = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      if (!items.length) return;
      setIndex(((next % items.length) + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    if (!multi || paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [multi, paused, items.length]);

  if (!items.length) return null;

  return (
    <div
      className="category-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        if (!t) return;
        touchStartX.current = t.clientX;
        touchStartY.current = t.clientY;
        swiping.current = false;
        setPaused(true);
      }}
      onTouchMove={(e) => {
        if (touchStartX.current == null || touchStartY.current == null) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - touchStartX.current;
        const dy = t.clientY - touchStartY.current;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
          swiping.current = true;
        }
      }}
      onTouchEnd={(e) => {
        const startX = touchStartX.current;
        touchStartX.current = null;
        touchStartY.current = null;
        setPaused(false);
        if (startX == null || !multi || !swiping.current) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - startX;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        goTo(dx < 0 ? index + 1 : index - 1);
      }}
    >
      <div className="category-carousel-stage" aria-live="polite">
        {items.map((slide, i) => {
          const active = i === index;
          return (
            <Link
              key={slide.id}
              href={slide.href}
              className={`category-card category-carousel-slide ${active ? "is-active" : ""}${slide.showCaption ? " has-caption" : ""}`}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              aria-label={slide.title}
              onClick={(e) => {
                if (swiping.current) {
                  e.preventDefault();
                }
              }}
            >
              <div className="category-media">
                <picture>
                  <source media="(max-width: 768px)" srcSet={slide.photoMobile} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.photo}
                    alt={slide.title}
                    className="category-photo"
                    width={2280}
                    height={600}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding={i === 0 ? "sync" : "async"}
                    draggable={false}
                  />
                </picture>
              </div>
              {slide.showCaption ? (
                <div className="category-card-caption">
                  <h3>{slide.title}</h3>
                  {slide.subtitle ? <p>{slide.subtitle}</p> : null}
                  <span className="category-carousel-more">Подробнее</span>
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>

      {multi ? (
        <>
          <button
            type="button"
            className="category-carousel-nav category-carousel-prev"
            aria-label="Предыдущий слайд"
            onClick={() => goTo(index - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="category-carousel-nav category-carousel-next"
            aria-label="Следующий слайд"
            onClick={() => goTo(index + 1)}
          >
            ›
          </button>
          <div className="category-carousel-dots" role="tablist" aria-label="Баннеры">
            {items.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={slide.title}
                className={i === index ? "is-active" : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
