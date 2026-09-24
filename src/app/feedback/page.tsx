"use client";

import { FormEvent, useState } from "react";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";
import { SiteForm } from "@/components/SiteForm";

export default function FeedbackPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
        consent: form.get("consent") === "true",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось отправить");
      setStatus("error");
      return;
    }
    setStatus("done");
    e.currentTarget.reset();
  }

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">Связь</p>
        <h1 className="page-title">Обратная связь</h1>
      </div>
      <SiteForm className="panel form-grid" style={{ maxWidth: "36rem" }} onSubmit={onSubmit}>
        <label>
          Категория
          <select name="category" required defaultValue="ask">
            <option value="suggest">Предложить</option>
            <option value="complain">Пожаловаться</option>
            <option value="ask">Спросить</option>
            <option value="praise">Похвалить</option>
          </select>
        </label>
        <label>
          Ваше имя *
          <input name="name" required />
        </label>
        <label>
          Email *
          <input name="email" type="email" required />
        </label>
        <label>
          Сообщение *
          <textarea name="message" rows={5} required />
        </label>
        <ConsentCheckbox />
        {error ? <p className="form-error">{error}</p> : null}
        {status === "done" ? <p className="form-success">Сообщение отправлено.</p> : null}
        <button className="btn btn-primary" disabled={status === "loading"}>
          {status === "loading" ? "Отправка..." : "Отправить"}
        </button>
      </SiteForm>
    </div>
  );
}
