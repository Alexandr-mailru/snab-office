import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const productId = String(body.productId || "");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: {},
    create: { userId: user.id, productId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const productId = String(body.productId || "");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await prisma.favorite.deleteMany({ where: { userId: user.id, productId } });
  return NextResponse.json({ ok: true });
}
