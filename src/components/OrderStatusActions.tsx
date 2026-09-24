"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUiFeedback } from "@/components/UiFeedback";
import { ORDER_STATUS_FLOW, ORDER_STATUS, orderStatusLabel, type OrderStatus } from "@/lib/orders";

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, ORDER_STATUS.CANCELLED];

export function OrderStatusActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { confirm, toast } = useUiFeedback();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function save(next: string) {
    if (next === currentStatus) return;

    if (next === ORDER_STATUS.CANCELLED) {
      const ok = await confirm({
        title: "Отменить заказ?",
        message: "Статус заказа станет «Отменён».",
        confirmLabel: "Отменить заказ",
        cancelLabel: "Не отменять",
        tone: "danger",
      });
      if (!ok) {
        setStatus(currentStatus);
        return;
      }
    }

    setLoading(true);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: next }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast({ message: data.error || "Не удалось изменить статус", tone: "error" });
      setStatus(currentStatus);
      return;
    }
    setStatus(next);
    toast({
      message:
        next === ORDER_STATUS.CANCELLED
          ? "Заказ отменён"
          : `Статус: ${orderStatusLabel(next as OrderStatus)}`,
      tone: "success",
    });
    router.refresh();
  }

  return (
    <div className="moderation-actions">
      <label className="order-status-select">
        Статус
        <select
          value={status}
          disabled={loading}
          onChange={(e) => {
            setStatus(e.target.value);
            void save(e.target.value);
          }}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
            </option>
          ))}
        </select>
      </label>
      {loading ? <span className="muted">Сохраняем…</span> : null}
    </div>
  );
}
