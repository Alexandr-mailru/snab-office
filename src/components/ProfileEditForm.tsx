"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  phone: string | null;
  companyName: string | null;
  inn: string | null;
  buyAsOrg: boolean;
};

export function ProfileEditForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [forOrg, setForOrg] = useState(initial.buyAsOrg);
  const [companyName, setCompanyName] = useState(initial.companyName ?? "");
  const [inn, setInn] = useState(initial.inn ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.trim() || null,
        buyAsOrg: forOrg,
        companyName: companyName.trim() || null,
        inn: inn.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Не удалось сохранить");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form className="form-grid profile-edit-form" onSubmit={onSubmit}>
      <label>
        Телефон
        <input
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (4242) 00-00-00"
          autoComplete="tel"
        />
      </label>

      <label className={`checkout-org-toggle ${forOrg ? "is-on" : ""}`}>
        <input
          type="checkbox"
          className="site-checkbox"
          checked={forOrg}
          onChange={(e) => setForOrg(e.target.checked)}
        />
        <span>
          <strong>Покупаю для организации</strong>
          <span className="checkout-choice-hint">Компания и ИНН для счетов и договоров</span>
        </span>
      </label>

      {forOrg ? (
        <fieldset className="checkout-org-fields profile-org-fields">
          <legend className="sr-only">Реквизиты организации</legend>
          <label>
            Компания
            <input
              name="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ООО «Пример»"
              autoComplete="organization"
            />
          </label>
          <label>
            ИНН
            <input
              name="inn"
              value={inn}
              onChange={(e) => setInn(e.target.value)}
              placeholder="6500000000"
              inputMode="numeric"
            />
          </label>
        </fieldset>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">Сохранено</p> : null}
      <button type="submit" className="btn btn-secondary" disabled={loading}>
        {loading ? "Сохраняем…" : "Сохранить профиль"}
      </button>
    </form>
  );
}
