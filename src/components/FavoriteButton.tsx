"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({ productId, initial }: { productId: string; initial?: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(!!initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/favorites", {
      method: on ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setLoading(false);
    if (res.status === 401) {
      router.push("/account");
      return;
    }
    if (!res.ok) return;
    setOn((v) => !v);
    router.refresh();
  }

  return (
    <button
      type="button"
      className={`btn ${on ? "btn-primary" : "btn-secondary"} favorite-btn`}
      onClick={toggle}
      disabled={loading}
      aria-pressed={on}
    >
      {on ? "В избранном" : "В избранное"}
    </button>
  );
}
