"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLightboxHistory } from "@/hooks/useLightboxHistory";

type ProductGalleryProps = {
  name: string;
  images: string[];
};

export function ProductGallery({ name, images }: ProductGalleryProps) {
  const photos = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const close = useLightboxHistory(open, setOpen);

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

  if (!photos.length) {
    return <div className="product-gallery product-gallery-empty" aria-hidden />;
  }

  const safeActive = Math.min(active, photos.length - 1);
  const current = photos[safeActive];

  const lightbox =
    open && mounted
      ? createPortal(
          <div
            className="news-lightbox product-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Фото: ${name}`}
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
                    <img src={photos[safeActive]} alt={name} className="news-lightbox-image" />
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
                        className={`news-lightbox-thumb${index === safeActive ? " is-active" : ""}`}
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
    <div className="product-gallery-wrap">
      <div className="product-gallery">
        <button
          type="button"
          className="product-gallery-zoom"
          onClick={() => openAt(safeActive)}
          aria-label="Открыть фото в галерее"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={name} className="product-gallery-image" />
        </button>
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              className="gallery-nav gallery-prev"
              aria-label="Предыдущее фото"
              onClick={() => setActive((i) => (i - 1 + photos.length) % photos.length)}
            >
              ‹
            </button>
            <button
              type="button"
              className="gallery-nav gallery-next"
              aria-label="Следующее фото"
              onClick={() => setActive((i) => (i + 1) % photos.length)}
            >
              ›
            </button>
            <p className="gallery-counter">
              {safeActive + 1} / {photos.length}
            </p>
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <div className="gallery-thumbs" role="tablist" aria-label="Фотографии товара">
          {photos.map((src, index) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={index === safeActive}
              className={`gallery-thumb ${index === safeActive ? "is-active" : ""}`}
              onClick={() => setActive(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}

      <p className="product-gallery-hint muted">Нажмите на фото, чтобы открыть</p>

      {lightbox}
    </div>
  );
}
