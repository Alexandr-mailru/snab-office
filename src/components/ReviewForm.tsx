"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteForm } from "@/components/SiteForm";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, body }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 401) {
      router.push("/account");
      return;
    }
    if (!res.ok) {
      setError(data.error || "Не удалось сохранить отзыв");
      return;
    }
    setBody("");
    setRating(5);
    setSuccess(data.message || "Отзыв отправлен на модерацию");
    router.refresh();
  }

  return (
    <SiteForm className="review-form" onSubmit={onSubmit}>
      <h3>Оставить отзыв</h3>
      <p className="muted" style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>
        Отзыв появится на сайте после проверки модератором.
      </p>
      <label>
        Оценка
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </select>
      </label>
      <label>
        Комментарий
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          required
          minLength={10}
          placeholder="Как товар в использовании?"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Отправка…" : "Отправить на модерацию"}
      </button>
    </SiteForm>
  );
}
