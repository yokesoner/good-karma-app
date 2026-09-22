"use client";

import { useState } from "react";
import { ArrowUpRight } from "@/components/icons";
import {
  confirmAdminTelegramLink,
  requestAdminTelegramLink,
  unlinkAdminTelegram,
} from "@/server/adminNotifications";

type Step = "idle" | "linking";

export function AdminTelegramLinkCard({ initialLinked }: { initialLinked: boolean }) {
  const [linked, setLinked] = useState(initialLinked);
  const [step, setStep] = useState<Step>("idle");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setPending(true);
    setError("");
    try {
      const res = await requestAdminTelegramLink();
      if (!res.ok) return setError(res.error);
      if (res.linked) {
        setLinked(true);
        return;
      }
      setTelegramUrl(res.telegramUrl);
      setStep("linking");
    } catch {
      setError("Не удалось связаться с сайтом. Попробуйте ещё раз");
    } finally {
      setPending(false);
    }
  }

  async function confirm() {
    setPending(true);
    setError("");
    try {
      const res = await confirmAdminTelegramLink();
      if (!res.ok) return setError(res.error);
      setLinked(true);
      setStep("idle");
    } catch {
      setError("Не удалось связаться с сайтом. Попробуйте ещё раз");
    } finally {
      setPending(false);
    }
  }

  async function unlink() {
    setPending(true);
    setError("");
    try {
      await unlinkAdminTelegram();
      setLinked(false);
      setStep("idle");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7">
      <h2 className="text-xl font-semibold">Telegram</h2>
      <p className="mt-2 text-sm text-ink-2">
        Личный push о каждом новом заказе — приходит на ваш телефон через Telegram, не общий чат.
      </p>

      {linked ? (
        <div className="mt-5">
          <p className="inline-flex rounded-full bg-tint-mint px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em]">Подключено</p>
          <button
            type="button"
            disabled={pending}
            onClick={unlink}
            className="mt-5 block rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] transition hover:border-plum disabled:opacity-50"
          >
            {pending ? "Отключаем…" : "Отключить"}
          </button>
        </div>
      ) : step === "idle" ? (
        <button
          type="button"
          disabled={pending}
          onClick={start}
          className="mt-5 rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50"
        >
          {pending ? "Готовим ссылку…" : "Подключить Telegram"}
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center rounded-2xl border border-cherry/30 bg-tint-sakura px-4 text-sm font-semibold text-ink transition hover:border-cherry/50"
          >
            Открыть бота и нажать Start <ArrowUpRight className="ml-1" />
          </a>
          <button
            type="button"
            disabled={pending}
            onClick={confirm}
            className="w-full rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50"
          >
            {pending ? "Проверяем…" : "Я нажал Start, продолжить"}
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-4 rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
    </section>
  );
}
