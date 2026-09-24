"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FocusTrap({
  active,
  children,
  onEscape,
}: {
  active: boolean;
  children: ReactNode;
  onEscape?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    prevFocus.current = document.activeElement as HTMLElement | null;

    function focusables() {
      return [...root!.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
      );
    }

    const first = focusables()[0];
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus.current?.focus?.();
    };
  }, [active, onEscape]);

  return (
    <div ref={ref} style={{ display: "contents" }} data-focus-trap={active ? "true" : undefined}>
      {children}
    </div>
  );
}
