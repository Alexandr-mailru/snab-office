import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { consentField } from "@/lib/consent";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  consent: consentField,
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Пользователь уже зарегистрирован" }, { status: 409 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        phone: body.phone || null,
        passwordHash: await bcrypt.hash(body.password, 10),
      },
    });
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, user.id);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Нужно согласие на обработку персональных данных" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Проверьте данные" }, { status: 400 });
  }
}
