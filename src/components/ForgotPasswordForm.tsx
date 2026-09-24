"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { SiteForm } from "@/components/SiteForm";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Не удалось отправить");
      return;
    }
    setDone(true);
  }

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">Мой кабинет</p>
        <h1 className="page-title">Восстановление пароля</h1>
        <p className="lead">Укажите email аккаунта — пришлём ссылку для сброса.</p>
      </div>
      {done ? (
        <div className="panel" style={{ maxWidth: "28rem" }}>
          <p>Если аккаунт существует, письмо уже отправлено. Проверьте почту.</p>
          <Link href="/account" className="btn btn-secondary">
            Ко входу
          </Link>
        </div>
      ) : (
        <SiteForm className="panel form-grid" style={{ maxWidth: "28rem" }} onSubmit={onSubmit}>
          <label>
            Email *
            <input name="email" type="email" required autoComplete="email" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Отправляем…" : "Отправить ссылку"}
          </button>
          <Link href="/account" className="text-link">
            Вернуться ко входу
          </Link>
        </SiteForm>
      )}
    </div>
  );
}
