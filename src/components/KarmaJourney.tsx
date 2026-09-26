"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LevelIcon } from "@/components/LevelIcon";
import { Bag, Check } from "@/components/icons";
import { cn } from "@/lib/cn";

export type JourneyLevel = {
  key: string;
  name: string;
  fromKarma: number;
  icon: string;
  perk: string;
  discountPct: number | null;
  discountsPerWeek: number | null;
};

export type JourneyReward = {
  id: string;
  costPoints: number;
  title: string;
};

/**
 * Единый блок Karma Club: сверху дорожка уровней, ниже — дорожка подарков
 * за баллы. Приём тот же, что в приложениях кофеен и трекерах привычек:
 * одна линия, остановки на ней и метка «вы здесь», которая едет к своей
 * позиции. Обе дорожки живут в одном контейнере намеренно — это один путь
 * покупателя, а не два независимых раздела.
 *
 * Остановки расставлены РАВНОМЕРНО, а не пропорционально стоимости:
 * пороги нелинейные (0 / 500 / 1200 / 2500 / 4000), и пропорциональная
 * шкала сплющила бы первые уровни в нечитаемую кашу. Позиция метки при
 * этом честная — интерполируется внутри своего отрезка.
 */
export function KarmaJourney({
  levels,
  rewards,
  points,
  className,
}: {
  levels: JourneyLevel[];
  rewards: JourneyReward[];
  /** Баллы покупателя. undefined — гость: дорожки показываем без личной метки. */
  points?: number;
  className?: string;
}) {
  // Анимация заливки и метки стартует после монтирования: до него позиция
  // нулевая, поэтому переход виден как движение по дорожке.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setLive(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const sortedLevels = [...levels].sort((a, b) => a.fromKarma - b.fromKarma);
  const sortedRewards = [...rewards].sort((a, b) => a.costPoints - b.costPoints);
  if (sortedLevels.length === 0) return null;

  const hasPoints = typeof points === "number";
  const balance = points ?? 0;

  const levelStops = sortedLevels.map((l) => l.fromKarma);
  const currentIndex = hasPoints
    ? Math.max(0, sortedLevels.findIndex((l, i) => balance >= l.fromKarma && (i === sortedLevels.length - 1 || balance < sortedLevels[i + 1]!.fromKarma)))
    : -1;
  const currentLevel = currentIndex >= 0 ? sortedLevels[currentIndex]! : null;
  const nextLevel = currentIndex >= 0 ? sortedLevels[currentIndex + 1] ?? null : null;

  const levelProgress = hasPoints ? positionOnTrack(balance, levelStops) : 0;
  // У подарков первая остановка стоит не на левом краю: слева — нулевой
  // баланс, так что видно и путь до самого первого подарка.
  const rewardStops = [0, ...sortedRewards.map((r) => r.costPoints)];
  const rewardProgress = hasPoints ? positionOnTrack(balance, rewardStops) : 0;
  const nextReward = sortedRewards.find((r) => r.costPoints > balance) ?? null;

  return (
    <section className={cn("overflow-hidden rounded-[32px] border border-gold/25 bg-paper-2 shadow-l", className)}>
      {/* Шапка: баланс и текущий уровень */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-hair-soft bg-gradient-to-br from-tint-cream via-paper-2 to-tint-lavender px-5 py-6 sm:px-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Karma Club</span>
          {hasPoints ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <b className="text-[40px] font-bold leading-none tracking-[-0.04em] sm:text-[52px]">
                {balance.toLocaleString("ru-RU")}
              </b>
              <span className="text-[13px] text-ink-2">баллов на карте</span>
            </div>
          ) : (
            <h2 className="mt-2 max-w-[18ch] text-[26px] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[34px]">
              Чем дольше вы с нами, тем выгоднее
            </h2>
          )}
        </div>

        {currentLevel ? (
          <div className="flex items-center gap-2.5 rounded-full border border-gold/30 bg-paper px-4 py-2.5 shadow-s">
            <LevelIcon name={currentLevel.icon} className="h-5 w-5 text-cherry" />
            <span className="text-[12px] font-bold uppercase tracking-[0.1em]">{currentLevel.name}</span>
          </div>
        ) : (
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center rounded-full bg-btn px-5 text-[11px] font-bold text-btn-fg shadow-s transition hover:shadow-m motion-safe:hover:-translate-y-0.5"
          >
            Моя карта
          </Link>
        )}
      </header>

      <div className="px-5 py-7 sm:px-8">
        {/* ── Дорожка уровней ─────────────────────────────────── */}
        <Track
          live={live}
          progress={levelProgress}
          marker={hasPoints ? balance : null}
          stopCount={sortedLevels.length}
          firstStopAtEdge
          minStopWidth={86}
        >
          {sortedLevels.map((level, i) => {
            const reached = hasPoints && balance >= level.fromKarma;
            const isCurrent = i === currentIndex;
            return (
              <Stop
                key={level.key}
                index={i}
                total={sortedLevels.length}
                firstStopAtEdge
                delayMs={i * 90}
                current={isCurrent}
                reached={reached}
                icon={<LevelIcon name={level.icon} className="h-[18px] w-[18px]" />}
                title={level.name}
                caption={level.fromKarma === 0 ? "старт" : `${level.fromKarma.toLocaleString("ru-RU")} б.`}
                chip={level.discountPct ? `−${level.discountPct}%` : null}
                chipTitle={level.discountPct && level.discountsPerWeek ? `${level.discountsPerWeek} раз(а) в неделю` : undefined}
              />
            );
          })}
        </Track>

        {/* Подпись под дорожкой уровней — что именно даёт текущий уровень */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[20px] border border-hair bg-paper/60 px-4 py-3 text-[12.5px] leading-snug">
          {currentLevel ? (
            <>
              <span className="font-semibold">
                {currentLevel.discountPct && currentLevel.discountsPerWeek
                  ? `Сейчас: −${currentLevel.discountPct}% на заказ, ${currentLevel.discountsPerWeek} раз(а) в неделю`
                  : "Сейчас: копите баллы — 10 ₽ покупок = 1 балл"}
              </span>
              {nextLevel && (
                <span className="text-ink-2">
                  До уровня «{nextLevel.name}» — {(nextLevel.fromKarma - balance).toLocaleString("ru-RU")} баллов
                </span>
              )}
            </>
          ) : (
            <span className="text-ink-2">
              Каждые 10 ₽ заказа — 1 балл. Баллы поднимают уровень, а уровень даёт скидку на заказ несколько раз в неделю.
            </span>
          )}
        </div>

        {/* ── Дорожка подарков ────────────────────────────────── */}
        {sortedRewards.length > 0 && (
          <div className="mt-8 border-t border-hair-soft pt-7">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-[15px] font-bold tracking-tight">Подарки за баллы</h3>
              <span className="text-[11.5px] text-ink-3">
                {nextReward && hasPoints
                  ? `До «${nextReward.title}» — ${(nextReward.costPoints - balance).toLocaleString("ru-RU")} баллов`
                  : "Баллы тратятся на подарки, уровень при этом остаётся"}
              </span>
            </div>

            <Track live={live} progress={rewardProgress} marker={null} stopCount={sortedRewards.length} minStopWidth={112}>
              {sortedRewards.map((reward, i) => {
                const reached = hasPoints && balance >= reward.costPoints;
                return (
                  <Stop
                    key={reward.id}
                    index={i}
                    total={sortedRewards.length}
                    delayMs={450 + i * 90}
                    reached={reached}
                    icon={reached ? <Check className="h-4 w-4" /> : <Bag className="h-4 w-4" />}
                    title={reward.title}
                    caption={`${reward.costPoints.toLocaleString("ru-RU")} б.`}
                    chip={null}
                  />
                );
              })}
            </Track>
          </div>
        )}
      </div>
    </section>
  );
}

/** Доля пути (0..1) по равномерно расставленным остановкам. */
function positionOnTrack(value: number, stops: number[]): number {
  const last = stops.length - 1;
  if (last <= 0) return 0;
  if (value <= stops[0]!) return 0;
  if (value >= stops[last]!) return 1;
  for (let i = 0; i < last; i++) {
    const from = stops[i]!;
    const to = stops[i + 1]!;
    if (value >= from && value < to) return (i + (value - from) / (to - from)) / last;
  }
  return 1;
}

/**
 * Позиция остановки в процентах. firstStopAtEdge — первая остановка на
 * левом краю (уровни: нулевой уровень и есть старт). Без него слева
 * остаётся отрезок до первой остановки (подарки: путь до первого подарка).
 */
function stopPercent(index: number, total: number, firstStopAtEdge: boolean): number {
  const segments = firstStopAtEdge ? total - 1 : total;
  if (segments <= 0) return 0;
  const step = 100 / segments;
  return firstStopAtEdge ? index * step : (index + 1) * step;
}

function Track({
  live,
  progress,
  marker,
  stopCount,
  firstStopAtEdge = false,
  minStopWidth,
  children,
}: {
  live: boolean;
  progress: number;
  /** Баллы для метки «вы здесь»; null — метку не показываем. */
  marker: number | null;
  stopCount: number;
  firstStopAtEdge?: boolean;
  /** Минимум ширины на одну остановку — ниже него дорожка скроллится вбок. */
  minStopWidth: number;
  children: React.ReactNode;
}) {
  const pct = live ? Math.round(progress * 1000) / 10 : 0;
  // На узком экране подписи вроде «Ролл Филадельфия» не помещаются в свою
  // долю ширины и налезают на соседние. Вместо обрезания текста даём
  // дорожке минимальную ширину и горизонтальный скролл — так делают и в
  // приложениях, откуда взят сам приём с дорожкой.
  const minWidth = stopCount * minStopWidth;

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="relative" style={{ minWidth }}>
      {/* Сама линия: серая подложка + заливка пройденного пути */}
      <div className={cn("relative h-2 rounded-full bg-hair-soft", marker !== null ? "mt-10" : "mt-1")}>
        <div
          className="journey-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-plum-deep via-cherry to-gold"
          style={{ width: `${pct}%` }}
        />

        {/* Метка «вы здесь» — привязана к верхнему краю линии через
            bottom-full, поэтому не зависит от высоты самой плашки и не
            наезжает на дорожку, куда бы ни уехала по ходу прогресса. */}
        {marker !== null && (
          <div
            className="journey-marker pointer-events-none absolute bottom-full z-20 -translate-x-1/2 pb-1.5"
            style={{ left: `${pct}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="whitespace-nowrap rounded-full bg-plum-deep px-2.5 py-1 text-[10px] font-bold text-[#FFF8F2] shadow-m">
                {marker.toLocaleString("ru-RU")}
              </span>
              <span aria-hidden className="-mt-[3px] h-2 w-2 rotate-45 bg-plum-deep" />
            </div>
          </div>
        )}
      </div>

      {/* Остановки — абсолютно спозиционированы поверх линии */}
      <div className="relative z-10" style={{ minHeight: stopCount > 0 ? 92 : 0 }}>
        {children}
      </div>
      </div>
    </div>
  );
}

function Stop({
  index,
  total,
  firstStopAtEdge = false,
  delayMs,
  reached,
  current = false,
  icon,
  title,
  caption,
  chip,
  chipTitle,
}: {
  index: number;
  total: number;
  firstStopAtEdge?: boolean;
  delayMs: number;
  reached: boolean;
  current?: boolean;
  icon: React.ReactNode;
  title: string;
  caption: string;
  chip: string | null;
  chipTitle?: string;
}) {
  const percent = stopPercent(index, total, firstStopAtEdge);
  // Крайние остановки прижимаем к своему краю, иначе подпись вылезает за
  // границы блока на узком экране.
  const align = percent <= 0 ? "left-0 translate-x-0 items-start text-left" : percent >= 100 ? "left-full -translate-x-full items-end text-right" : "-translate-x-1/2 items-center text-center";

  return (
    <div
      className={cn("journey-stop absolute top-0 flex w-[68px] flex-col sm:w-[92px]", align)}
      style={{ left: percent > 0 && percent < 100 ? `${percent}%` : undefined, ["--stop-delay" as string]: `${delayMs}ms` }}
    >
      <span
        className={cn(
          "relative -mt-[22px] grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 shadow-s transition-colors duration-500",
          current && "journey-here",
          reached
            ? "border-paper bg-gradient-to-br from-cherry to-plum-deep text-white"
            : "border-paper bg-paper-3 text-ink-3",
        )}
      >
        {icon}
      </span>
      <b className="mt-2 line-clamp-2 text-[10.5px] font-semibold leading-tight sm:text-[11.5px]">{title}</b>
      <span className="mt-0.5 text-[9.5px] text-ink-3">{caption}</span>
      {chip && (
        <span
          title={chipTitle}
          className={cn(
            "mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
            reached ? "bg-tint-mint text-ink" : "bg-paper-3 text-ink-3",
          )}
        >
          {chip}
        </span>
      )}
    </div>
  );
}
