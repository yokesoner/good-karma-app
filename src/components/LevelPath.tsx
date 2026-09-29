"use client";

import { LevelIcon } from "@/components/LevelIcon";
import { PathBar, PathRail, PathStop, threadProgress, type PathNodeState } from "@/components/PathRail";
import { cn } from "@/lib/cn";
import { timesPerWeek } from "@/lib/karma";

export type PathLevel = {
  key: string;
  name: string;
  fromKarma: number;
  icon: string;
  perk: string;
  discountPct: number | null;
  discountsPerWeek: number | null;
};

type CardState = "done" | "current" | "next" | "locked" | "guest";

// Палитра «тир-карт»: от светлой кремово-мятной к глубокой сливово-золотой.
// Уровней в админке может быть сколько угодно — цвет берётся по положению
// уровня на шкале, а не по его номеру, поэтому первый всегда самый светлый,
// последний — самый насыщенный. Классы — литералами, чтобы их видел Tailwind.
const TIERS = [
  { band: "from-[#F4EFE4] via-[#EEF1E7] to-[#DCE9E0]", text: "text-[#2F3A33]", sub: "text-[#2F3A33]/65", halo: "bg-white/60 text-[#4F7A66]" },
  { band: "from-[#F8E7E9] via-[#F2DDE4] to-[#E6CBD6]", text: "text-[#4A2A38]", sub: "text-[#4A2A38]/65", halo: "bg-white/60 text-[#9A536E]" },
  { band: "from-[#EDE8F5] via-[#DFD7ED] to-[#CEC3E2]", text: "text-[#352B4A]", sub: "text-[#352B4A]/65", halo: "bg-white/60 text-[#6B5A94]" },
  { band: "from-[#6E4062] via-[#553149] to-[#3A2338]", text: "text-[#FFF5F0]", sub: "text-[#FFF5F0]/65", halo: "bg-white/12 text-[#F7D9A6]" },
  { band: "from-[#2A1A28] via-[#3A2338] to-[#6E5530]", text: "text-[#FFF5E6]", sub: "text-[#FFF5E6]/65", halo: "bg-white/10 text-[#F2D08E]" },
] as const;

function tierFor(index: number, total: number) {
  const top = TIERS.length - 1;
  const position = total <= 1 ? 0 : Math.floor((index * top) / (total - 1));
  return TIERS[position]!;
}

/**
 * Путь уровней Karma Club: карточка на каждый уровень на той же золотой
 * нити, что и путь подарков. Нить заполнена до баланса, карточка текущего
 * уровня показывает шкалу до следующего.
 */
export function LevelPath({
  levels,
  points,
  title = "Уровни клуба",
  headingAs,
}: {
  levels: PathLevel[];
  points?: number;
  title?: string;
  headingAs?: "h2" | "h3";
}) {
  const sorted = [...levels].sort((a, b) => a.fromKarma - b.fromKarma);
  if (sorted.length === 0) return null;

  const hasPoints = typeof points === "number";
  const balance = points ?? 0;
  const currentIndex = hasPoints
    ? Math.max(0, sorted.findIndex((level, i) => balance >= level.fromKarma && (i === sorted.length - 1 || balance < sorted[i + 1]!.fromKarma)))
    : -1;
  const current = currentIndex >= 0 ? sorted[currentIndex]! : null;
  const next = currentIndex >= 0 ? sorted[currentIndex + 1] ?? null : null;

  const subtitle = current
    ? [
        current.discountPct && current.discountsPerWeek
          ? `Сейчас: −${current.discountPct}% на заказ, ${timesPerWeek(current.discountsPerWeek)}.`
          : "Сейчас: копите баллы — 10 ₽ заказа = 1 балл.",
        next ? `До уровня «${next.name}» — ${(next.fromKarma - balance).toLocaleString("ru-RU")} баллов.` : "Это высший уровень клуба.",
      ].join(" ")
    : "Каждые 10 ₽ заказа — 1 балл. Баллы поднимают уровень, а уровень даёт скидку на заказ несколько раз в неделю.";

  return (
    <PathRail
      title={title}
      headingAs={headingAs}
      subtitle={subtitle}
      listLabel="Путь уровней"
      count={sorted.length}
      progress={hasPoints ? threadProgress(balance, sorted.map((level) => level.fromKarma)) : 0}
    >
      {sorted.map((level, index) => {
        const state: CardState = !hasPoints
          ? "guest"
          : index < currentIndex
            ? "done"
            : index === currentIndex
              ? "current"
              : index === currentIndex + 1
                ? "next"
                : "locked";
        const nodeState: PathNodeState =
          state === "done" ? "done" : state === "current" ? "current" : state === "locked" ? "locked" : "neutral";
        const toNext = next ? Math.max(0.04, Math.min(1, (balance - level.fromKarma) / Math.max(1, next.fromKarma - level.fromKarma))) : 1;

        return (
          <PathStop
            key={level.key}
            index={index}
            node={{ state: nodeState, label: <LevelIcon name={level.icon} className="h-4 w-4" /> }}
            progress={state === "current" ? toNext : 0}
            state={state}
          >
            <LevelCard
              level={level}
              index={index}
              total={sorted.length}
              state={state}
              nextLevel={state === "current" ? next : null}
              balance={balance}
            />
          </PathStop>
        );
      })}
    </PathRail>
  );
}

function LevelCard({
  level,
  index,
  total,
  state,
  nextLevel,
  balance,
}: {
  level: PathLevel;
  index: number;
  total: number;
  state: CardState;
  nextLevel: PathLevel | null;
  balance: number;
}) {
  const tier = tierFor(index, total);
  const from = level.fromKarma.toLocaleString("ru-RU");
  const hasDiscount = Boolean(level.discountPct && level.discountsPerWeek);
  const dim = state === "locked";

  return (
    <article
      className={cn(
        "path-card relative mt-3 flex w-full flex-1 flex-col overflow-hidden rounded-[24px] border bg-paper-2 transition duration-500",
        state === "current" ? "border-cherry/40 shadow-m" : state === "done" ? "border-gold/45 shadow-s" : "border-hair shadow-s",
      )}
    >
      {/* Шапка «тир-карты» */}
      <div className={cn("relative isolate flex aspect-[4/3] flex-col justify-between overflow-hidden bg-gradient-to-br p-4", tier.band, tier.text, dim && "saturate-[.7]")}>
        <LevelIcon name={level.icon} className="pointer-events-none absolute -bottom-6 -right-5 -z-10 h-32 w-32 opacity-[0.13]" />
        <div className="flex items-center justify-between gap-2">
          {/* Бейдж важнее номера: при узкой карточке сжимается номер, бейдж — никогда. */}
          <span className={cn("min-w-0 truncate text-micro font-bold uppercase tracking-[0.14em]", tier.sub)}>
            Уровень {String(index + 1).padStart(2, "0")}
          </span>
          {state === "current" && (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-cherry px-2.5 py-1 text-micro font-bold uppercase tracking-[0.06em] text-white shadow-s">
              Ваш уровень
            </span>
          )}
          {state === "done" && (
            <span className={cn("shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-micro font-bold uppercase tracking-[0.06em]", tier.halo)}>
              пройден
            </span>
          )}
        </div>
        <span className={cn("grid h-14 w-14 place-items-center rounded-full shadow-s backdrop-blur-sm", tier.halo)}>
          <LevelIcon name={level.icon} className="h-7 w-7" />
        </span>
        <div>
          <b className="block truncate text-[24px] font-bold leading-none tracking-[-0.03em]">{level.name}</b>
          <span className={cn("mt-1.5 block text-caption font-semibold", tier.sub)}>
            {level.fromKarma === 0 ? "с первого заказа" : `с ${from} баллов`}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <b className={cn("text-[20px] font-bold leading-tight tracking-[-0.02em]", dim && "text-ink-2")}>
          {hasDiscount ? `−${level.discountPct}% на заказ` : "10 ₽ = 1 балл"}
        </b>
        <span className="mt-0.5 text-[12.5px] text-ink-2">
          {hasDiscount ? timesPerWeek(level.discountsPerWeek!) : "Базовое начисление за каждый заказ"}
        </span>
        {level.perk && <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-ink-3">{level.perk}</p>}

        <div className="mt-auto pt-4">
          {state === "current" &&
            (nextLevel ? (
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="font-bold text-cherry">Вы здесь</span>
                  <span className="tabular-nums text-ink-2">
                    до «{nextLevel.name}» — {(nextLevel.fromKarma - balance).toLocaleString("ru-RU")}
                  </span>
                </div>
                <PathBar />
              </div>
            ) : (
              <p className="text-[12px] font-bold text-cherry">Вы на вершине клуба</p>
            ))}
          {state === "next" && (
            <p className="text-[12px] text-ink-2">
              Следующий: откроется на <span className="font-semibold tabular-nums">{from}</span> баллах
            </p>
          )}
          {state === "locked" && (
            <p className="text-[12px] text-ink-3">
              Откроется на <span className="font-semibold tabular-nums text-ink-2">{from}</span> баллах
            </p>
          )}
          {state === "guest" && (
            <p className="text-[12px] font-semibold text-ink-2">{index === 0 ? "Старт — сразу после первого заказа" : `Шаг ${index + 1} клуба`}</p>
          )}
        </div>
      </div>
    </article>
  );
}
