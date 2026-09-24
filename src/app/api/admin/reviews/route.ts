import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail, recalculateProductRating, REVIEW_STATUS } from "@/lib/reviews";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await prisma.review.findMany({
    where: { status: REVIEW_STATUS.PENDING },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ reviews });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const action = String(body.action || "").toLowerCase();

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action: approve | reject" }, { status: 400 });
  }

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  const status = action === "approve" ? REVIEW_STATUS.APPROVED : REVIEW_STATUS.REJECTED;

  await prisma.review.update({
    where: { id },
    data: { status, moderatedAt: new Date() },
  });

  await recalculateProductRating(review.productId);

  return NextResponse.json({ ok: true, status });
}
