"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteForm } from "@/components/SiteForm";

type NewsDraft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage?: string | null;
  publishedAt: string;
};

export function AdminNewsForm({ initial }: { initial?: NewsDraft }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      id: initial?.id,
      title: String(form.get("title") || ""),
      slug: String(form.get("slug") || ""),
      excerpt: String(form.get("excerpt") || ""),
      body: String(form.get("body") || ""),
      coverImage: String(form.get("coverImage") || "") || null,
      publishedAt: String(form.get("publishedAt") || ""),
    };
    const res = await fetch("/api/admin/news", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }
    router.push("/admin/news");
    router.refresh();
  }

  const publishedDefault = initial?.publishedAt
    ? initial.publishedAt.slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  return (
    <SiteForm className="panel form-grid" onSubmit={onSubmit}>
      <label>
        Заголовок *
        <input name="title" required defaultValue={initial?.title || ""} />
      </label>
      <label>
        slug *
        <input name="slug" required defaultValue={initial?.slug || ""} />
      </label>
      <label>
        Анонс *
        <textarea name="excerpt" rows={3} required defaultValue={initial?.excerpt || ""} />
      </label>
      <label>
        Текст *
        <textarea name="body" rows={10} required defaultValue={initial?.body || ""} />
      </label>
      <label>
        Обложка (URL)
        <input name="coverImage" defaultValue={initial?.coverImage || ""} />
      </label>
      <label>
        Дата публикации *
        <input name="publishedAt" type="datetime-local" required defaultValue={publishedDefault} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Сохраняем…" : initial?.id ? "Обновить" : "Создать"}
      </button>
    </SiteForm>
  );
}
