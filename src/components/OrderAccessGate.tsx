"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { trackOrder } from "@/server/orderTracking";

export function OrderAccessGate({ number }: { number: string }) {
  const router = useRouter();
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
      router.refresh();
    } catch {
      setError("Не удалось проверить заказ. Попробуйте ещё раз");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[440px] rounded-l border border-hair bg-paper-2 p-6 md:p-10">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">Заказ {number}</span>
      <h1 className="mt-3 text-[24px] font-bold tracking-tight">Подтвердите телефон</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
        Чтобы увидеть детали заказа, введите телефон, который указывали при оформлении.
      </p>
      <form onSubmit={submit} className="mt-6">
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 999 000-00-00"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          aria-invalid={!!error}
          className="w-full rounded-[16px] border border-hair bg-paper px-4 py-4 text-[16px] outline-none transition focus:border-cherry/60 focus:ring-4 focus:ring-cherry/10"
        />
        {error && <p role="alert" className="mt-3 text-[12.5px] text-cherry">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-btn px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-btn-fg transition disabled:opacity-50"
        >
          {pending ? "Проверяем…" : "Показать заказ"}
        </button>
      </form>
    </div>
  );
}
