"use client";

import { useEffect, useCallback, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  COLLAGE_TILES,
  collageTileShape,
  type NewsCollageLayout,
} from "@/lib/shopNews";
import { useLightboxHistory } from "@/hooks/useLightboxHistory";

type NewsGalleryProps = {
  images: string[];
  title?: string;
  layout?: NewsCollageLayout;
};

export function NewsGallery({
  images,
  title = "Галерея",
  layout = "infinity",
}: NewsGalleryProps) {
  const photos = images.filter(Boolean);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  const close = useLightboxHistory(open, setOpen);
  const tiles = COLLAGE_TILES[layout] ?? COLLAGE_TILES.infinity;

  const go = useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      setActive((i) => (i + delta + photos.length) % photos.length);
    },
    [photos.length],
  );

  const openAt = (index: number) => {
    setActive(index);
    setOpen(true);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go, close]);

  if (!photos.length) return null;

  const safeActive = Math.min(active, photos.length - 1);

  const lightbox =
    open && mounted
      ? createPortal(
          <div
            className="news-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр фото"
          >
            <div className="news-lightbox-stage" onClick={close}>
              <div className="news-lightbox-cluster" onClick={(e) => e.stopPropagation()}>
                <div className="news-lightbox-frame">
                  {photos.length > 1 ? (
                    <button
                      type="button"
                      className="news-lightbox-nav news-lightbox-prev"
                      aria-label="Предыдущее фото"
                      onClick={() => go(-1)}
                    >
                      ‹
                    </button>
                  ) : (
                    <span className="news-lightbox-nav-spacer" aria-hidden />
                  )}

                  <div className="news-lightbox-photo">
                    <button
                      type="button"
                      className="news-lightbox-back"
                      onClick={close}
                      aria-label="Закрыть галерею"
                    >
                      ← Назад
                    </button>
                    <p className="news-lightbox-counter">
                      {safeActive + 1} / {photos.length}
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photos[safeActive]}
                      alt=""
                      className="news-lightbox-image"
                    />
                  </div>

                  {photos.length > 1 ? (
                    <button
                      type="button"
                      className="news-lightbox-nav news-lightbox-next"
                      aria-label="Следующее фото"
                      onClick={() => go(1)}
                    >
                      ›
                    </button>
                  ) : (
                    <span className="news-lightbox-nav-spacer" aria-hidden />
                  )}
                </div>

                {photos.length > 1 ? (
                  <div className="news-lightbox-thumbs" role="tablist" aria-label="Все фото">
                    {photos.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        role="tab"
                        aria-selected={index === safeActive}
                        className={`news-lightbox-thumb${
                          index === safeActive ? " is-active" : ""
                        }`}
                        onClick={() => setActive(index)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section className="news-gallery" aria-label={title}>
      <div className="news-gallery-head">
        <h2 className="news-section-title">{title}</h2>
        <p className="news-gallery-hint">Нажмите на фото, чтобы открыть</p>
      </div>

      <div className={`news-collage news-collage--${layout}`}>
        {photos.map((src, index) => {
          const tile = tiles[index] ?? { s: 1, w: 1, h: 1 };
          const shape = collageTileShape(tile.w, tile.h);
          return (
            <button
              key={src}
              type="button"
              className={`news-collage-cell news-collage-cell--${shape}`}
              style={
                {
                  "--s": tile.s,
                  "--ar-w": tile.w,
                  "--ar-h": tile.h,
                } as CSSProperties
              }
              onClick={() => openAt(index)}
              aria-label={`Открыть фото ${index + 1} из ${photos.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                width={tile.w}
                height={tile.h}
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {lightbox}
    </section>
  );
}
