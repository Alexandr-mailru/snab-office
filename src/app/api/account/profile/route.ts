import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  phone: z.string().max(40).nullable().optional(),
  buyAsOrg: z.boolean().optional(),
  companyName: z.string().max(120).nullable().optional(),
  inn: z
    .string()
    .max(12)
    .regex(/^\d{0,12}$/, "ИНН — только цифры")
    .nullable()
    .optional(),
});

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const phone = body.phone?.trim() || null;
    const companyName = body.companyName?.trim() || null;
    const inn = body.inn?.trim() || null;
    const buyAsOrg = body.buyAsOrg ?? false;

    if (inn && inn.length !== 10 && inn.length !== 12) {
      return NextResponse.json({ error: "ИНН должен содержать 10 или 12 цифр" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phone, companyName, inn, buyAsOrg },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Проверьте данные профиля" }, { status: 400 });
    }
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}
