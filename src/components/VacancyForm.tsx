"use client";

import { FormEvent, useState } from "react";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";
import { SiteForm } from "@/components/SiteForm";

export function VacancyForm({ vacancies }: { vacancies: { slug: string; title: string }[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/vacancies/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...Object.fromEntries(form.entries()),
        consent: form.get("consent") === "true",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Ошибка отправки");
      setStatus("error");
      return;
    }
    setStatus("done");
    e.currentTarget.reset();
  }

  return (
    <SiteForm className="panel form-grid" style={{ maxWidth: "40rem" }} onSubmit={onSubmit}>
      <h2 style={{ margin: 0 }}>Анкета</h2>
      <label>
        Ф.И.О. *
        <input name="fullName" required />
      </label>
      <label>
        Email *
        <input name="email" type="email" required />
      </label>
      <label>
        Вакансия *
        <select name="vacancySlug" required defaultValue={vacancies[0]?.slug}>
          {vacancies.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Образование *
        <input name="education" required />
      </label>
      <label>
        Контактные данные *
        <input name="contacts" required />
      </label>
      <label>
        Опыт работы *
        <textarea name="experience" rows={4} required />
      </label>
      <label>
        Дополнительно
        <textarea name="extra" rows={3} />
      </label>
      <ConsentCheckbox />
      {error ? <p className="form-error">{error}</p> : null}
      {status === "done" ? <p className="form-success">Анкета отправлена.</p> : null}
      <button className="btn btn-primary" disabled={status === "loading"}>
        Отправить анкету
      </button>
    </SiteForm>
  );
}
