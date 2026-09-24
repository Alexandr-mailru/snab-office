import { prisma } from "@/lib/prisma";
import { VacancyForm } from "@/components/VacancyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Вакансии" };

export default async function VacanciesPage() {
  const vacancies = await prisma.vacancy.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="page-shell page-shell-page">
      <div className="page-header">
        <p className="eyebrow">Работа в СнабОфис</p>
        <h1 className="page-title">Вакансии</h1>
      </div>
      <div className="split-band layout-full">
        {vacancies.map((vacancy) => (
          <article key={vacancy.id} className="info-card">
            <h3>{vacancy.title}</h3>
            {vacancy.salary ? <p><strong>{vacancy.salary}</strong></p> : null}
            {vacancy.schedule ? <p className="muted">{vacancy.schedule}</p> : null}
            <p><strong>Обязанности:</strong> {vacancy.duties}</p>
            <p><strong>Требования:</strong> {vacancy.requirements}</p>
          </article>
        ))}
      </div>
      <VacancyForm vacancies={vacancies.map((v) => ({ slug: v.slug, title: v.title }))} />
    </div>
  );
}
