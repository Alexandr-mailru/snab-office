import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetMail } from "@/lib/customer-emails";
import { siteUrl } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return ok to avoid email enumeration
    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      const token = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      await sendPasswordResetMail(user.email, siteUrl(`/account/reset?token=${token}`));
    }

    return NextResponse.json({
      ok: true,
      message: "Если аккаунт существует, мы отправили ссылку для сброса пароля",
    });
  } catch {
    return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
  }
}
