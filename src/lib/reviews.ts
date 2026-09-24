import { prisma } from "@/lib/prisma";

export const REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "demo@snaboffice.local";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export async function recalculateProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: REVIEW_STATUS.APPROVED },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });
}
