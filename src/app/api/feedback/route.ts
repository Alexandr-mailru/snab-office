import { NextResponse } from "next/server";
import { z } from "zod";
import { consentField } from "@/lib/consent";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  category: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(5),
  consent: consentField,
});

export async function POST(request: Request) {
  try {
    const data = schema.parse(await request.json());
    await prisma.feedback.create({
      data: {
        category: data.category,
        name: data.name,
        email: data.email,
        message: data.message,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы и согласие на обработку ПДн" },
      { status: 400 },
    );
  }
}
