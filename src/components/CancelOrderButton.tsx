"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUiFeedback } from "@/components/UiFeedback";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { confirm, toast } = useUiFeedback();
  const [loading, setLoading] = useState(false);

  async function onCancel() {
    const ok = await confirm({
      title: "Отменить заказ?",
      message: "Это действие нельзя отменить.",
      confirmLabel: "Отменить заказ",
      cancelLabel: "Оставить",
      tone: "danger",
    });
    if (!ok) return;

    setLoading(true);
    const res = await fetch(`/api/account/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast({ message: data.error || "Не удалось отменить заказ", tone: "error" });
      return;
    }

    toast({ message: "Заказ отменён", tone: "success" });
    router.refresh();
  }

  return (
    <div className="reorder-wrap">
      <button
        type="button"
        className="btn btn-danger-outline"
        disabled={loading}
        onClick={() => void onCancel()}
      >
        {loading ? "Отменяем…" : "Отменить заказ"}
      </button>
    </div>
  );
}
