"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LevelIcon } from "@/components/LevelIcon";
import type { getLoyaltyCustomer } from "@/server/adminLoyalty";
import { adminAdjustPoints, adminRedeemReward } from "@/server/adminLoyalty";
import { adminFieldClass, adminLabelClass } from "@/components/admin/formStyles";

type Customer = NonNullable<Awaited<ReturnType<typeof getLoyaltyCustomer>>>;

const REASON_LABELS: Record<string, string> = {
  ORDER_EARNED: "Начислено за заказ",
  REWARD_REDEEMED: "Обмен на награду",
  EVENT_BONUS: "Бонус",
  EXPIRED: "Сгорело",
  MANUAL_ADJUSTMENT: "Ручная корректировка",
};

export function AdminLoyaltyPanel({ code, initial }: { code: string; initial: Customer }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");

  async function redeem(rewardId: string, title: string, costPoints: number) {
    if (!window.confirm(`Выдать «${title}» и списать ${costPoints} баллов?`)) return;
    setError("");
    startTransition(async () => {
      const result = await adminRedeemReward({ loyaltyCode: code, rewardId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setData((prev) => ({ ...prev, points: result.newBalance }));
      router.refresh();
    });
  }

  function adjust(sign: 1 | -1) {
    const n = Math.abs(Math.round(Number(amount)));
    if (!n || Number.isNaN(n)) {
      setError("Укажите число баллов");
      return;
    }
    const verb = sign > 0 ? "начислить" : "списать";
    if (!window.confirm(`Точно ${verb} ${n} баллов?`)) return;
    setError("");
    startTransition(async () => {
      const result = await adminAdjustPoints({ loyaltyCode: code, points: n * sign, note: note || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setData((prev) => ({ ...prev, points: prev.points + n * sign }));
      setAmount("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <article className="overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-br from-[#3A2338] to-[#4A2C46] p-6 text-[#FFF8F2] shadow-m">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/70 bg-white/15 text-[22px] font-bold">
            {data.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- аватарка с диска сервера
              <img src={data.user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (data.user.name?.trim().charAt(0).toUpperCase() || "К")
            )}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-[19px] font-bold">{data.user.name || "Гость Гуд Кармы"}</b>
            <span className="text-[12px] text-white/70">{data.user.phone}</span>
            {data.level && (
              <span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#F7D9A6]">
                <LevelIcon name={data.level.icon} className="h-[14px] w-[14px]" /> {data.level.name}
              </span>
            )}
          </div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/15 pt-5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Баланс</span>
            <b className="mt-1 block text-[36px] font-bold leading-none tracking-[-0.03em]">{new Intl.NumberFormat("ru-RU").format(data.points)}</b>
          </div>
          <span className="text-[11px] text-white/50">баллов</span>
        </div>
      </article>

      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}

      <section className="rounded-[26px] border border-hair bg-paper-2 p-5 md:p-6">
        <h2 className="text-[15px] font-bold">Начислить или списать вручную</h2>
        <p className="mt-1 text-[12px] text-ink-2">Для оплаты на кассе без онлайн-заказа — по правилу 10 ₽ = 1 балл. Или для исправления ошибки.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr]">
          <label>
            <span className={adminLabelClass}>Баллы</span>
            <input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={adminFieldClass} placeholder="100" />
          </label>
          <label>
            <span className={adminLabelClass}>Комментарий · необязательно</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={adminFieldClass} placeholder="Например, оплата на кассе" />
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" disabled={pending} onClick={() => adjust(1)} className="min-h-11 rounded-full bg-plum-deep px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">Начислить</button>
          <button type="button" disabled={pending} onClick={() => adjust(-1)} className="min-h-11 rounded-full border border-hair px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-2 disabled:opacity-50">Списать</button>
        </div>
      </section>

      <section className="rounded-[26px] border border-hair bg-paper-2 p-5 md:p-6">
        <h2 className="text-[15px] font-bold">Выдать награду</h2>
        <p className="mt-1 text-[12px] text-ink-2">Товар выдаётся сразу в руки — баллы списываются, заказ не создаётся.</p>
        <div className="mt-4 flex flex-col gap-3">
          {data.rewards.map((r) => (
            <div key={r.id} className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${r.available ? "border-gold/30 bg-tint-sakura/40" : "border-hair bg-paper/50"}`}>
              <div className="min-w-0">
                <b className="block text-[13.5px] font-semibold">{r.title}</b>
                <span className="text-[11.5px] text-ink-3">
                  {r.costPoints.toLocaleString("ru-RU")} баллов
                  {r.kind === "PRODUCT" && r.productNames.length > 0 ? ` · ${r.productNames.join(", ")}` : ""}
                </span>
                {r.restrictionError && <p className="mt-1 text-[11px] text-cherry">{r.restrictionError}</p>}
              </div>
              <button
                type="button"
                disabled={!r.available || pending}
                onClick={() => redeem(r.id, r.title, r.costPoints)}
                className="min-h-10 shrink-0 rounded-full bg-btn px-4 text-[11px] font-bold text-btn-fg disabled:opacity-40"
              >
                Выдать
              </button>
            </div>
          ))}
          {data.rewards.length === 0 && <p className="text-[12px] text-ink-2">Активных наград пока нет.</p>}
        </div>
      </section>

      {data.recentEntries.length > 0 && (
        <section className="rounded-[26px] border border-hair bg-paper-2 p-5 md:p-6">
          <h2 className="text-[15px] font-bold">Последние операции</h2>
          <div className="mt-3 flex flex-col">
            {data.recentEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 border-b border-hair-soft py-2.5 text-[12.5px] last:border-b-0">
                <div className="min-w-0">
                  <span className="block">{REASON_LABELS[e.reason] ?? e.reason}{e.rewardTitle ? ` · ${e.rewardTitle}` : ""}</span>
                  <span className="text-[11px] text-ink-3">{new Date(e.createdAt).toLocaleString("ru-RU")}</span>
                </div>
                <b className={e.points >= 0 ? "text-mint-deep" : "text-cherry"}>{e.points >= 0 ? "+" : ""}{e.points}</b>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
