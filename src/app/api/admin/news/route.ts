import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/reviews";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(120),
  excerpt: z.string().min(2).max(500),
  body: z.string().min(2).max(20000),
  coverImage: z.string().max(500).nullable().optional(),
  publishedAt: z.string().min(4),
});

async function guard() {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export async function POST(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = schema.parse(await request.json());
    const news = await prisma.news.create({
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        body: body.body,
        coverImage: body.coverImage || null,
        publishedAt: new Date(body.publishedAt),
      },
    });
    return NextResponse.json({ ok: true, news });
  } catch {
    return NextResponse.json({ error: "Не удалось создать" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = schema.parse(await request.json());
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const news = await prisma.news.update({
      where: { id: body.id },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        body: body.body,
        coverImage: body.coverImage || null,
        publishedAt: new Date(body.publishedAt),
      },
    });
    return NextResponse.json({ ok: true, news });
  } catch {
    return NextResponse.json({ error: "Не удалось обновить" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.news.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
