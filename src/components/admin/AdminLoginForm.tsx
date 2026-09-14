"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdmin } from "@/server/adminAuth";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      const result = await loginAdmin({ email: form.get("email"), password: form.get("password") });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const requested = searchParams.get("next");
      const destination = requested?.startsWith("/admin/") && !requested.startsWith("//")
        ? requested
        : "/admin/products";
      router.replace(destination);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-ink-2">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="w-full rounded-2xl border border-hair bg-paper-2 px-4 py-3.5 text-sm outline-none transition focus:border-plum"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-ink-2">Пароль</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-2xl border border-hair bg-paper-2 px-4 py-3.5 text-sm outline-none transition focus:border-plum"
        />
      </label>
      {error && <p role="alert" className="rounded-xl bg-tint-blush px-4 py-3 text-sm text-cherry">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-plum-deep px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-btn-fg transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Проверяем…" : "Войти"}
      </button>
    </form>
  );
}
