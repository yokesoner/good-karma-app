"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findLoyaltyCodeByPhone } from "@/server/adminLoyalty";
import { adminFieldClass, adminLabelClass } from "@/components/admin/formStyles";

export function AdminLoyaltySearch() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await findLoyaltyCodeByPhone({ phone });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/loyalty/${result.loyaltyCode}`);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label>
        <span className={adminLabelClass}>Телефон клиента</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 900 000-00-00"
          className={adminFieldClass}
        />
      </label>
      {error && <p role="alert" className="text-[12.5px] text-cherry">{error}</p>}
      <button disabled={pending} className="min-h-11 rounded-full bg-plum-deep px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">
        {pending ? "Ищем…" : "Найти карту"}
      </button>
    </form>
  );
}
