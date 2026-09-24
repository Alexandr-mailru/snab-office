"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

type SuggestPayload = {
  products: { slug: string; name: string; brandName: string | null; imageUrl: string | null; price: number }[];
  brands: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
};

export function SearchBox({
  className = "header-search",
  initialQuery = "",
  onSubmitExtra,
}: {
  className?: string;
  initialQuery?: string;
  onSubmitExtra?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestPayload | null>(null);
  const [panelTop, setPanelTop] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const requestSeqRef = useRef(0);
  const isCatalogMobile = className.includes("header-search-catalog");

  useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  useEffect(() => {
    if (!open || !isCatalogMobile) {
      setPanelTop(null);
      return;
    }
    function place() {
      const box = wrapRef.current?.getBoundingClientRect();
      if (!box) return;
      setPanelTop(Math.round(box.bottom + 8));
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, isCatalogMobile, query]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      return;
    }
    const seq = ++requestSeqRef.current;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Suggest failed");
        const json = (await res.json()) as SuggestPayload;
        if (seq !== requestSeqRef.current) return;
        setData(json);
        setOpen(true);
      } catch {
        if (seq !== requestSeqRef.current) return;
        setData(null);
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    onSubmitExtra?.();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/catalog");
  }

  const hasSuggest =
    !!data && (data.products.length > 0 || data.brands.length > 0 || data.categories.length > 0);

  return (
    <div className={`search-box ${className}`} ref={wrapRef}>
      <form className="search-box-form" onSubmit={onSearch} role="search">
        <input
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            if (next.trim().length < 2) {
              setData(null);
              setOpen(false);
            }
          }}
          onFocus={() => hasSuggest && setOpen(true)}
          placeholder="Поиск по каталогу"
          aria-label="Поиск"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit" className="btn btn-primary search-btn">
          Найти
        </button>
      </form>

      {open && query.trim().length >= 2 ? (
        <div
          className={`suggest-panel${isCatalogMobile ? " suggest-panel--sheet" : ""}`}
          role="listbox"
          style={
            isCatalogMobile && panelTop != null
              ? ({ top: `${panelTop}px` } as CSSProperties)
              : undefined
          }
        >
          {loading && !data ? <p className="suggest-muted">Ищем…</p> : null}
          {!loading && data && !hasSuggest ? <p className="suggest-muted">Ничего не найдено</p> : null}

          {data?.products.length ? (
            <div className="suggest-group">
              <p className="suggest-label">Товары</p>
              {data.products.map((p) => (
                <Link
                  key={p.slug}
                  href={`/product/${p.slug}`}
                  className="suggest-item"
                  onClick={() => {
                    setOpen(false);
                    onSubmitExtra?.();
                  }}
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" />
                  ) : (
                    <span className="suggest-thumb" />
                  )}
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.brandName ? `${p.brandName} · ` : ""}
                      {formatPrice(p.price)}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {data?.brands.length ? (
            <div className="suggest-group">
              <p className="suggest-label">Бренды</p>
              {data.brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/brands/${b.slug}`}
                  className="suggest-link"
                  onClick={() => {
                    setOpen(false);
                    onSubmitExtra?.();
                  }}
                >
                  {b.name}
                </Link>
              ))}
            </div>
          ) : null}

          {data?.categories.length ? (
            <div className="suggest-group">
              <p className="suggest-label">Категории</p>
              {data.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/catalog/${c.slug}`}
                  className="suggest-link"
                  onClick={() => {
                    setOpen(false);
                    onSubmitExtra?.();
                  }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : null}

          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            className="suggest-all"
            onClick={() => {
              setOpen(false);
              onSubmitExtra?.();
            }}
          >
            Все результаты по запросу «{query.trim()}»
          </Link>
        </div>
      ) : null}
    </div>
  );
}
