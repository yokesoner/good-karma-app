"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass } from "@/components/admin/formStyles";
import { ALLOWED_STATUSES_BY_FULFILLMENT, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orderLabels";
import { type AdminOrderStatusInput, updateAdminOrder } from "@/server/adminOrders";

export function AdminOrderStatusForm({
  id,
  initial,
}: {
  id: string;
  initial: AdminOrderStatusInput & { fulfillment: "PICKUP" | "DELIVERY" };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const allowedStatuses = ALLOWED_STATUSES_BY_FULFILLMENT[initial.fulfillment];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      status: String(form.get("status")) as AdminOrderStatusInput["status"],
      paymentStatus: String(form.get("paymentStatus")) as AdminOrderStatusInput["paymentStatus"],
    };
    setError("");
    startTransition(async () => {
      const result = await updateAdminOrder(id, input);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7">
      <h2 className="text-xl font-semibold">Статусы</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label>
          <span className={adminLabelClass}>Статус заказа</span>
          <select name="status" defaultValue={initial.status} className={adminFieldClass}>
            {allowedStatuses.map((value) => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}
          </select>
        </label>
        <label>
          <span className={adminLabelClass}>Статус оплаты</span>
          <select name="paymentStatus" defaultValue={initial.paymentStatus} className={adminFieldClass}>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-5 rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="mt-6 flex justify-end">
        <button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : "Сохранить"}</button>
      </div>
    </form>
  );
}
