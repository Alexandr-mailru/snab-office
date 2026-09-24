import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  if (!slug || slug.length > 200 || /[^\w.-]/.test(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price: true,
      oldPrice: true,
      stock: true,
      imageUrl: true,
      images: true,
      imageHint: true,
      brandName: true,
      ratingAvg: true,
      ratingCount: true,
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}
