import { hasCookieConsent } from "@/lib/cookieConsent";

export type RecentProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  viewedAt: number;
};

const KEY = "snaboffice-recent";
const MAX = 12;

export function readRecentlyViewed(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  if (!hasCookieConsent()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(item: Omit<RecentProduct, "viewedAt">) {
  if (typeof window === "undefined") return;
  if (!hasCookieConsent()) return;
  const list = readRecentlyViewed().filter((x) => x.slug !== item.slug);
  list.unshift({ ...item, viewedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}
