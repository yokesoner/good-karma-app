"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Level = {
  key: string;
  name: string;
  fromKarma: number;
  toKarma: number;
  perk: string;
};

type Reward = { id: string; costPoints: number; title: string; description: string };

// Курс начисления: 1 балл за каждые 10 ₽ — ровно как в прототипе,
// где product.karma был примерно равен price/10.
const KARMA_PER_RUBLE = 0.1;

export function KarmaCalculator({
  levels,
  rewards,
}: {
  levels: Level[];
  rewards: Reward[];
}) {
  const [orderRub, setOrderRub] = useState(1500);
  const [ordersPerMonth, setOrdersPerMonth] = useState(2);

  const perOrder = Math.round(orderRub * KARMA_PER_RUBLE);
  const inThreeMonths = perOrder * ordersPerMonth * 3;

  // Уровни приходят из базы. Если их вдруг нет (пустая таблица, неудачный
  // сид) — рисовать нечего, но и падать компонент не должен.
  const first = levels[0];
  if (!first) return null;

  const current =
    levels.find((l) => inThreeMonths >= l.fromKarma && inThreeMonths < l.toKarma) ??
    levels[levels.length - 1] ??
    first;
  const next = levels[levels.indexOf(current) + 1] ?? null;

  const span = (next ? next.fromKarma : current.toKarma) - current.fromKarma;
  const progress = Math.min(
    100,
    Math.round(((inThreeMonths - current.fromKarma) / Math.max(span, 1)) * 100),
  );

  const unlocked = rewards.filter((r) => inThreeMonths >= r.costPoints);

  return (
    <div className="mt-9 rounded-l border border-white/15 bg-white/[0.07] p-6 md:p-8">
      <span className="mb-5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4ECF2]/55">
        Посчитайте свою карму
      </span>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline justify-between text-[13px] text-[#F4ECF2]/75">
            Средний заказ
            <b className="text-[17px] font-bold text-[#F7D9A6]">{orderRub} ₽</b>
          </span>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={orderRub}
            onChange={(e) => setOrderRub(Number(e.target.value))}
            className="mt-3 w-full accent-[#F7D9A6]"
            aria-label="Средняя сумма заказа"
          />
        </label>

        <label className="block">
          <span className="flex items-baseline justify-between text-[13px] text-[#F4ECF2]/75">
            Заказов в месяц
            <b className="text-[17px] font-bold text-[#F7D9A6]">{ordersPerMonth}</b>
          </span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={ordersPerMonth}
            onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
            className="mt-3 w-full accent-[#F7D9A6]"
            aria-label="Количество заказов в месяц"
          />
        </label>
      </div>

      <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4ECF2]/55">
            За один заказ
          </span>
          <b className="mt-1 block text-[28px] font-bold leading-none">+{perOrder}</b>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4ECF2]/55">
            За три месяца
          </span>
          <b className="mt-1 block text-[28px] font-bold leading-none text-[#F7D9A6]">
            {inThreeMonths}
          </b>
        </div>
        <div className="ml-auto text-right">
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4ECF2]/55">
            Ваш уровень
          </span>
          <b className="mt-1 block text-[20px] font-bold uppercase leading-none">{current.name}</b>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F7D9A6] to-[#E8A0B4] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2.5 text-[12px] text-[#F4ECF2]/70">
          {next
            ? `До уровня ${next.name} — ${next.fromKarma - inThreeMonths} баллов`
            : "Максимальный уровень достигнут"}
        </p>
      </div>

      {unlocked.length > 0 && (
        <p className="mt-4 text-[12.5px] text-[#F4ECF2]/75">
          Этого хватит на:{" "}
          <b className="font-bold text-[#F7D9A6]">
            {unlocked[unlocked.length - 1]!.title.toLowerCase()}
          </b>
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {levels.map((lvl) => {
          const active = lvl.key === current.key;
          return (
            <div
              key={lvl.key}
              className={cn(
                "rounded-m border px-4 py-3.5 transition",
                active
                  ? "border-[#F7D9A6]/60 bg-white/[0.16]"
                  : "border-white/15 bg-white/[0.05]",
              )}
            >
              <b
                className={cn(
                  "block text-[12px] font-bold uppercase tracking-[0.1em]",
                  active && "text-[#F7D9A6]",
                )}
              >
                {lvl.name}
              </b>
              <span className="mt-1 block text-[11px] text-[#F4ECF2]/60">
                {lvl.fromKarma}
                {lvl.toKarma >= 6000 ? "+" : `—${lvl.toKarma}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
