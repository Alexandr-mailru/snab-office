"use client";

import { usePathname, useRouter } from "next/navigation";

/** Site-wide one-step back (history), hidden on the home page. */
export function SiteBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || pathname === "/") return null;

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <div className="site-back-bar">
      <div className="site-back-bar-inner">
        <button type="button" className="site-back-btn" onClick={goBack}>
          ← Назад
        </button>
      </div>
    </div>
  );
}
