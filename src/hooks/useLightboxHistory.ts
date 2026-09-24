"use client";

import { useCallback, useEffect, useRef } from "react";

const HISTORY_KEY = "snabofficeLightbox";

/**
 * When lightbox is open, browser/OS Back closes it (one history step)
 * without leaving the current page.
 */
export function useLightboxHistory(open: boolean, setOpen: (v: boolean) => void) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    window.history.pushState({ [HISTORY_KEY]: true }, "");
    pushedRef.current = true;

    function onPopState() {
      pushedRef.current = false;
      setOpen(false);
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (pushedRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
    };
  }, [open, setOpen]);

  return useCallback(() => {
    if (pushedRef.current) {
      window.history.back();
      return;
    }
    setOpen(false);
  }, [setOpen]);
}
