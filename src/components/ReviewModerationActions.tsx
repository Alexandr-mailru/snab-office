"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUiFeedback } from "@/components/UiFeedback";

export function ReviewModerationActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const { confirm, toast } = useUiFeedback();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function act(action: "approve" | "reject") {
    if (action === "reject") {
      const ok = await confirm({
        title: "Отклонить отзыв?",
        message: "Отзыв не будет опубликован на сайте.",
        confirmLabel: "Отклонить",
        cancelLabel: "Оставить",
        tone: "danger",
      });
      if (!ok) return;
    }

    setLoading(action);
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId, action }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      toast({ message: data.error || "Не удалось выполнить действие", tone: "error" });
      return;
    }
    toast({
      message: action === "approve" ? "Отзыв опубликован" : "Отзыв отклонён",
      tone: "success",
    });
    router.refresh();
  }

  return (
    <div className="moderation-actions">
      <button
        type="button"
        className="btn btn-primary"
        disabled={!!loading}
        onClick={() => void act("approve")}
      >
        {loading === "approve" ? "…" : "Опубликовать"}
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={!!loading}
        onClick={() => void act("reject")}
      >
        {loading === "reject" ? "…" : "Отклонить"}
      </button>
    </div>
  );
}
