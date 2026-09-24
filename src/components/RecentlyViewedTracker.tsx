"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/recently-viewed";

export function RecentlyViewedTracker({
  product,
}: {
  product: { id: string; slug: string; name: string; price: number; imageUrl?: string | null };
}) {
  useEffect(() => {
    pushRecentlyViewed(product);
  }, [product]);
  return null;
}
