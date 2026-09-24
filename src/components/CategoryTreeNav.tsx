"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  findCategoryPathIds,
  type CategoryTreeNode,
} from "@/lib/categoryTree";

export type { CategoryTreeNode };

type Props = {
  categories: CategoryTreeNode[];
  activeCategorySlug?: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "mega";
  showAllLink?: boolean;
};

const OPEN_DELAY_MS = 160;
const CLOSE_DELAY_MS = 280;
const MOBILE_MQ = "(max-width: 900px)";

function TreeBranch({
  node,
  depth,
  openIds,
  toggle,
  isActive,
  onNavigate,
}: {
  node: CategoryTreeNode;
  depth: number;
  openIds: Set<string>;
  toggle: (id: string) => void;
  isActive: (slug: string) => boolean;
  onNavigate?: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const open = openIds.has(node.id);
  const levelClass =
    depth === 0
      ? "category-tree-root"
      : depth === 1
        ? "category-tree-mid"
        : depth === 2
          ? "category-tree-leaf"
          : "category-tree-deep";

  return (
    <div
      className={`category-tree-branch${depth === 1 ? " category-tree-branch--mid" : ""}${open ? " is-open" : ""}`}
    >
      <div className="category-tree-row">
        {hasChildren ? (
          <button
            type="button"
            className="category-tree-toggle"
            aria-expanded={open}
            aria-label={open ? `Свернуть «${node.name}»` : `Развернуть «${node.name}»`}
            onClick={() => toggle(node.id)}
          >
            <span aria-hidden>▾</span>
          </button>
        ) : (
          <span className="category-tree-toggle-spacer" aria-hidden />
        )}
        <Link
          href={`/catalog/${node.slug}`}
          className={`category-tree-link ${levelClass}${isActive(node.slug) ? " is-active" : ""}`}
          onClick={onNavigate}
        >
          {node.name}
        </Link>
      </div>

      {hasChildren ? (
        <div className="category-tree-anim" data-open={open ? "true" : "false"}>
          <div className="category-tree-anim-inner">
            <div
              className={`category-tree-children${depth >= 1 ? " category-tree-leaves" : ""}`}
            >
              {node.children.map((child) => (
                <TreeBranch
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  openIds={openIds}
                  toggle={toggle}
                  isActive={isActive}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MegaLeaves({
  nodes,
  depth,
  isActive,
  onNavigate,
}: {
  nodes: CategoryTreeNode[];
  depth: number;
  isActive: (slug: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className={depth === 0 ? "category-mega-flyout-leaves" : "category-mega-flyout-deep"}>
      {nodes.map((node) => (
        <div key={node.id} className="category-mega-flyout-deep-item">
          <Link
            href={`/catalog/${node.slug}`}
            className={`category-mega-flyout-leaf${depth > 0 ? " category-mega-flyout-leaf--nested" : ""}${isActive(node.slug) ? " is-active" : ""}`}
            onClick={onNavigate}
          >
            {node.name}
          </Link>
          {node.children.length ? (
            <MegaLeaves
              nodes={node.children}
              depth={depth + 1}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function CategoryTreeNav({
  categories,
  activeCategorySlug,
  onNavigate,
  variant = "sidebar",
  showAllLink = true,
}: Props) {
  const pathIds = useMemo(
    () => findCategoryPathIds(categories, activeCategorySlug),
    [categories, activeCategorySlug],
  );
  const pathOpen = useMemo(() => new Set(pathIds), [pathIds]);
  const pathRootId = pathIds[0] ?? null;

  const [isMobile, setIsMobile] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(pathOpen);
  const [hoverRootId, setHoverRootId] = useState<string | null>(pathRootId);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      for (const id of pathOpen) next.add(id);
      return next;
    });
    if (pathRootId) setHoverRootId(pathRootId);
  }, [pathOpen, pathRootId]);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function clearTimers() {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isActive(slug: string) {
    return activeCategorySlug === slug;
  }

  function scheduleHoverRoot(id: string | null) {
    clearTimers();
    if (id) {
      openTimer.current = setTimeout(() => setHoverRootId(id), OPEN_DELAY_MS);
    } else {
      closeTimer.current = setTimeout(() => setHoverRootId(null), CLOSE_DELAY_MS);
    }
  }

  function renderAccordionTree(treeVariant: string, extraClass = "") {
    return (
      <nav
        className={`category-tree category-tree--${treeVariant} ${extraClass}`.trim()}
        aria-label="Категории каталога"
      >
        {showAllLink ? (
          <Link
            href="/catalog"
            className={`category-tree-link category-tree-all${!activeCategorySlug ? " is-active" : ""}`}
            onClick={onNavigate}
          >
            Все товары
          </Link>
        ) : null}

        {categories.map((root) => (
          <TreeBranch
            key={root.id}
            node={root}
            depth={0}
            openIds={openIds}
            toggle={toggle}
            isActive={isActive}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    );
  }

  if (variant === "sidebar") {
    return renderAccordionTree("sidebar");
  }

  const previewRoot =
    categories.find((c) => c.id === hoverRootId) ??
    categories.find((c) => c.children.length > 0) ??
    null;

  return (
    <div className="category-mega-shell">
      <div className="category-mega-desktop" aria-hidden={isMobile || undefined}>
        <nav className="category-tree category-tree--mega" aria-label="Категории каталога">
          <div className="category-mega-layout">
            <div className="category-mega-roots">
              {showAllLink ? (
                <Link
                  href="/catalog"
                  className={`category-mega-root-link category-tree-all${!activeCategorySlug ? " is-active" : ""}`}
                  onClick={onNavigate}
                  onMouseEnter={() => scheduleHoverRoot(null)}
                >
                  Все товары
                </Link>
              ) : null}

              {categories.map((root) => {
                const hasChildren = root.children.length > 0;
                const selected = hoverRootId === root.id;
                return (
                  <div
                    key={root.id}
                    className={`category-mega-root${selected ? " is-hot" : ""}${isActive(root.slug) || pathRootId === root.id ? " is-current" : ""}`}
                    onMouseEnter={() => {
                      if (hasChildren) scheduleHoverRoot(root.id);
                      else scheduleHoverRoot(null);
                    }}
                    onFocus={() => {
                      if (hasChildren) {
                        clearTimers();
                        setHoverRootId(root.id);
                      }
                    }}
                  >
                    <div className="category-mega-root-row">
                      <Link
                        href={`/catalog/${root.slug}`}
                        className={`category-mega-root-link${isActive(root.slug) ? " is-active" : ""}`}
                        onClick={onNavigate}
                      >
                        {root.name}
                      </Link>
                      {hasChildren ? (
                        <button
                          type="button"
                          className="category-mega-root-more"
                          aria-label={`Подкатегории «${root.name}»`}
                          aria-expanded={selected}
                          onClick={() => {
                            clearTimers();
                            setHoverRootId(root.id);
                          }}
                        >
                          ›
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`category-mega-flyout${previewRoot?.children.length ? " is-visible" : ""}`}
              onMouseEnter={() => {
                if (previewRoot) {
                  clearTimers();
                  setHoverRootId(previewRoot.id);
                }
              }}
              onMouseLeave={() => scheduleHoverRoot(null)}
            >
              {previewRoot && previewRoot.children.length ? (
                <div key={previewRoot.id} className="category-mega-flyout-inner">
                  <Link
                    href={`/catalog/${previewRoot.slug}`}
                    className="category-mega-flyout-title"
                    onClick={onNavigate}
                  >
                    Все в «{previewRoot.name}»
                  </Link>
                  <div className="category-mega-flyout-grid">
                    {previewRoot.children.map((mid) => (
                      <div key={mid.id} className="category-mega-flyout-group">
                        <Link
                          href={`/catalog/${mid.slug}`}
                          className={`category-mega-flyout-mid${isActive(mid.slug) ? " is-active" : ""}`}
                          onClick={onNavigate}
                        >
                          {mid.name}
                        </Link>
                        {mid.children.length ? (
                          <MegaLeaves
                            nodes={mid.children}
                            depth={0}
                            isActive={isActive}
                            onNavigate={onNavigate}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="category-mega-flyout-empty muted">
                  Наведите на категорию, чтобы увидеть подкатегории
                </p>
              )}
            </div>
          </div>
        </nav>
      </div>

      <div className="category-mega-mobile">
        {renderAccordionTree("mega", "category-tree--mega-mobile")}
      </div>
    </div>
  );
}
