import { NextResponse } from "next/server";
import { z } from "zod";
import { consentField } from "@/lib/consent";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  vacancySlug: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  education: z.string().min(2),
  contacts: z.string().min(2),
  experience: z.string().min(2),
  extra: z.string().optional(),
  consent: consentField,
});

export async function POST(request: Request) {
  try {
    const data = schema.parse(await request.json());
    const vacancy = await prisma.vacancy.findUnique({ where: { slug: data.vacancySlug } });
    if (!vacancy) {
      return NextResponse.json({ error: "Вакансия не найдена" }, { status: 404 });
    }
    await prisma.jobApplication.create({
      data: {
        vacancySlug: data.vacancySlug,
        fullName: data.fullName,
        email: data.email,
        education: data.education,
        contacts: data.contacts,
        experience: data.experience,
        extra: data.extra || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля анкеты и согласие на обработку ПДн" },
      { status: 400 },
    );
  }
}
