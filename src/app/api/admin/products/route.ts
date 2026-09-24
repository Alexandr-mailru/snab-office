import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/reviews";

const schema = z.object({
  id: z.string().min(1),
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  onSale: z.boolean().optional(),
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
});

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = schema.parse(await request.json());
    const { id, ...data } = body;
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 400 });
  }
}
