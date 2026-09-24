import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REVIEW_STATUS } from "@/lib/reviews";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Войдите, чтобы оставить отзыв" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productId = String(body.productId || "");
  const rating = Number(body.rating);
  const text = String(body.body || "").trim();

  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Оценка от 1 до 5" }, { status: 400 });
  }
  if (text.length < 10) {
    return NextResponse.json({ error: "Напишите чуть подробнее (от 10 символов)" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  });

  if (existing?.status === REVIEW_STATUS.APPROVED) {
    return NextResponse.json(
      { error: "Ваш отзыв уже опубликован. Изменения недоступны." },
      { status: 409 },
    );
  }

  await prisma.review.upsert({
    where: { productId_userId: { productId, userId: user.id } },
    update: {
      rating,
      body: text,
      status: REVIEW_STATUS.PENDING,
      moderatedAt: null,
    },
    create: {
      productId,
      userId: user.id,
      rating,
      body: text,
      status: REVIEW_STATUS.PENDING,
    },
  });

  return NextResponse.json({
    ok: true,
    status: REVIEW_STATUS.PENDING,
    message: "Отзыв отправлен на модерацию",
  });
}
