import { createHash } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(6).max(100),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const tokenHash = hashToken(body.token);
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!row || row.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Ссылка недействительна или истекла. Запросите сброс снова." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
    ]);

    return NextResponse.json({ ok: true, message: "Пароль обновлён" });
  } catch {
    return NextResponse.json({ error: "Проверьте данные" }, { status: 400 });
  }
}
