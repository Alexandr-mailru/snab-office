"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteForm } from "@/components/SiteForm";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const password2 = String(form.get("password2") || "");
    if (password !== password2) {
      setLoading(false);
      setError("Пароли не совпадают");
      return;
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Не удалось сменить пароль");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  if (!token) {
    return (
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Ссылка недействительна</h1>
          <Link href="/account/forgot" className="btn btn-primary">
            Запросить новую
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">Мой кабинет</p>
        <h1 className="page-title">Новый пароль</h1>
      </div>
      <SiteForm className="panel form-grid" style={{ maxWidth: "28rem" }} onSubmit={onSubmit}>
        <label>
          Новый пароль *
          <input name="password" type="password" required minLength={6} autoComplete="new-password" />
        </label>
        <label>
          Повторите пароль *
          <input name="password2" type="password" required minLength={6} autoComplete="new-password" />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Сохраняем…" : "Сохранить пароль"}
        </button>
      </SiteForm>
    </div>
  );
}
