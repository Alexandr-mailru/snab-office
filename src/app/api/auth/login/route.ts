import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, user.id);
    return res;
  } catch {
    return NextResponse.json({ error: "Проверьте данные" }, { status: 400 });
  }
}
