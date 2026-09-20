"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { trackOrder } from "@/server/orderTracking";

export function TrackOrderForm() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await trackOrder({ number, phone });
      if (!res.ok) return setError(res.error);
      router.push(`/order/${res.orderNumber}`);
    } catch {
      setError("Не удалось проверить заказ. Попробуйте ещё раз");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-[440px] rounded-l border border-hair bg-paper-2 p-6 md:p-10">
      <label className="block">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-3">Номер заказа</span>
        <input
          className="mt-2 w-full rounded-[16px] border border-hair bg-paper px-4 py-4 text-[16px] outline-none transition focus:border-cherry/60 focus:ring-4 focus:ring-cherry/10"
          placeholder="GK-00001"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          required
        />
      </label>
      <label className="mt-5 block">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-3">Телефон</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="mt-2 w-full rounded-[16px] border border-hair bg-paper px-4 py-4 text-[16px] outline-none transition focus:border-cherry/60 focus:ring-4 focus:ring-cherry/10"
          placeholder="+7 999 000-00-00"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      </label>
      {error && <p role="alert" className="mt-3 text-[12.5px] text-cherry">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-btn px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-btn-fg transition disabled:opacity-50"
      >
        {pending ? "Ищем…" : "Найти заказ"}
      </button>
    </form>
  );
}
