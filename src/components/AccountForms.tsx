"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";
import { SiteForm } from "@/components/SiteForm";

function safeNextPath(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/account/cabinet";
  return next;
}

export function AccountForms({
  showDemoHint,
  nextPath,
}: {
  showDemoHint: boolean;
  nextPath?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const afterAuth = safeNextPath(nextPath);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "register"
          ? {
              ...Object.fromEntries(form.entries()),
              consent: form.get("consent") === "true",
            }
          : Object.fromEntries(form.entries()),
      ),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Ошибка");
      return;
    }
    router.push(afterAuth);
    router.refresh();
  }

  return (
    <div className="page-shell" style={{ paddingBottom: "3rem" }}>
      <div className="page-header">
        <p className="eyebrow">Мой кабинет</p>
        <h1 className="page-title">{mode === "login" ? "Вход" : "Регистрация"}</h1>
        {showDemoHint ? (
          <p className="lead">
            Демо: <code>demo@snaboffice.local</code> / <code>demo1234</code>
          </p>
        ) : (
          <p className="lead">
            {nextPath === "/checkout"
              ? "Войдите, чтобы оформить заказ."
              : "Войдите, чтобы видеть заказы и избранное."}
          </p>
        )}
        <p className="account-switch">
          {mode === "login" ? (
            <>
              Нет аккаунта?{" "}
              <button type="button" className="text-link" onClick={() => setMode("register")}>
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{" "}
              <button type="button" className="text-link" onClick={() => setMode("login")}>
                Войти
              </button>
            </>
          )}
        </p>
      </div>

      <SiteForm className="panel form-grid" style={{ maxWidth: "28rem" }} onSubmit={onSubmit}>
        {mode === "register" ? (
          <label>
            Имя *
            <input name="name" required />
          </label>
        ) : null}
        <label>
          Email *
          <input name="email" type="email" required />
        </label>
        <label>
          Пароль *
          <input name="password" type="password" required minLength={6} />
        </label>
        {mode === "register" ? (
          <>
            <label>
              Телефон
              <input name="phone" />
            </label>
            <ConsentCheckbox />
          </>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
        {mode === "login" ? (
          <p className="muted">
            <a href="/account/forgot" className="text-link">
              Забыли пароль?
            </a>
          </p>
        ) : null}
      </SiteForm>
    </div>
  );
}
