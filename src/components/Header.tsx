"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { CategoryTreeNav, type CategoryTreeNode } from "@/components/CategoryTreeNav";
import { FocusTrap } from "@/components/FocusTrap";
import { PhoneLink } from "@/components/PhoneText";
import { SearchBox } from "@/components/SearchBox";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";

export type NavCategory = CategoryTreeNode;

export type HeaderUser = {
  name: string;
  email: string;
} | null;

const links = [
  { href: "/catalog", label: "Каталог" },
  { href: "/brands", label: "Бренды" },
  { href: "/corporate", label: "Для организаций" },
  { href: "/stores", label: "Магазины" },
  { href: "/news", label: "Новости" },
];

export function Header({
  categories,
  user,
}: {
  categories: NavCategory[];
  user: HeaderUser;
}) {
  const pathname = usePathname();
  const totalItems = useCart((s) => s.totalItems());
  const totalPrice = useCart((s) => s.totalPrice());
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => {
    setCartReady(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const locked = open || menuOpen;
    document.body.classList.toggle("nav-locked", locked);
    document.documentElement.classList.toggle("nav-locked", locked);
    return () => {
      document.body.classList.remove("nav-locked");
      document.documentElement.classList.remove("nav-locked");
    };
  }, [open, menuOpen]);

  const activeCategorySlug = useMemo(() => {
    const match = pathname.match(/^\/catalog\/([^/?#]+)/);
    return match?.[1];
  }, [pathname]);
  const accountHref = user ? "/account/cabinet" : "/account";
  const accountLabel = user ? "Кабинет" : "Войти";
  const cartCount = cartReady ? totalItems : 0;
  const cartSum = cartReady ? formatPrice(totalPrice) : formatPrice(0);

  function closeAll() {
    setOpen(false);
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="header-top">
        <div className="header-top-inner">
          <span>Москва · с 1999 года</span>
          <div className="header-top-links">
            <PhoneLink phone="(4242) 22-36-36" />
            <a href="tel:+79147553467" className="header-telegram">
              Telegram
            </a>
          </div>
        </div>
      </div>

      <div className="header-main">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="СнабОфис — на главную">
            <BrandLogo variant="header" />
          </Link>

          <SearchBox className="header-search header-search-desktop" />

          <div className="header-actions">
            <Link href={accountHref} className="header-account">
              {accountLabel}
            </Link>
            <Link
              href="/cart"
              className="cart-link"
              aria-label={`Корзина, ${cartCount} тов., ${cartSum}`}
            >
              <svg
                className="cart-link-icon"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M7 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m10 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2M7.17 14.75c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03L20.88 5.5c.08-.16.12-.33.12-.5 0-.55-.45-1-1-1H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.45C5.09 14.32 5 14.65 5 15c0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z"
                />
              </svg>
              <span className="cart-link-label">Корзина</span>
              <span className="cart-count">{cartCount}</span>
              <span className="cart-sum">{cartSum}</span>
            </Link>
            <button
              type="button"
              className={`nav-toggle ${open ? "is-open" : ""}`}
              aria-expanded={open}
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              onClick={() => {
                setOpen((v) => !v);
                setMenuOpen(false);
              }}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      <div className="header-catalog-bar">
        <div className="header-inner catalog-bar-inner">
          <div className="mega-wrap">
            <button
              type="button"
              className="mega-trigger"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((v) => !v);
                setOpen(false);
              }}
            >
              Категории
            </button>
            {menuOpen ? (
              <FocusTrap active onEscape={() => setMenuOpen(false)}>
                <div className="mega-panel" role="navigation" aria-label="Дерево категорий">
                  <div className="mobile-drawer-head mega-drawer-head">
                    <strong>Категории</strong>
                    <button type="button" className="drawer-close" onClick={() => setMenuOpen(false)}>
                      Закрыть
                    </button>
                  </div>
                  <div className="mega-panel-scroll">
                    <CategoryTreeNav
                      categories={categories}
                      activeCategorySlug={activeCategorySlug}
                      onNavigate={closeAll}
                      variant="mega"
                      showAllLink
                    />
                  </div>
                </div>
              </FocusTrap>
            ) : null}
          </div>

          <SearchBox
            className="header-search header-search-catalog"
            onSubmitExtra={closeAll}
          />

          <FocusTrap active={open} onEscape={() => setOpen(false)}>
            <nav className={`nav ${open ? "is-open" : ""}`} aria-label="Основное меню">
              <div className="mobile-drawer-head">
                <strong>Меню</strong>
                <button type="button" className="drawer-close" onClick={() => setOpen(false)}>
                  Закрыть
                </button>
              </div>
              <div className="mobile-nav-meta">
                <Link href={accountHref} className="mobile-nav-account" onClick={closeAll}>
                  {accountLabel}
                </Link>
                <PhoneLink phone="(4242) 22-36-36" />
                <a href="tel:+79147553467">Telegram</a>
              </div>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={pathname.startsWith(link.href) ? "is-active" : undefined}
                  onClick={closeAll}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/catalog?filter=new" onClick={closeAll}>
                Новинки
              </Link>
              <Link href="/catalog?filter=sale" onClick={closeAll}>
                Распродажа
              </Link>
              <Link href="/delivery" onClick={closeAll}>
                Доставка
              </Link>
            </nav>
          </FocusTrap>
        </div>
      </div>

      {open || menuOpen ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Закрыть меню"
          onClick={closeAll}
        />
      ) : null}
    </header>
  );
}
