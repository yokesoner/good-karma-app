"use client";

import Link from "next/link";
import { LevelIcon } from "@/components/LevelIcon";
import { LevelPath, type PathLevel } from "@/components/LevelPath";
import { RewardPath, type PathReward } from "@/components/RewardPath";
import { cn } from "@/lib/cn";

export type JourneyLevel = PathLevel;
export type JourneyReward = PathReward;

/**
 * Единый блок Karma Club: шапка с балансом, ниже путь уровней и путь
 * подарков — оба карточками на золотой нити (LevelPath / RewardPath на
 * общем каркасе PathRail). Оба пути живут в одном контейнере намеренно —
 * это один путь покупателя, а не два независимых раздела.
 *
 * Карточки стоят РАВНОМЕРНО, а не пропорционально стоимости: пороги
 * нелинейные (0 / 500 / 1200 / 2500 / 4000), и пропорциональная шкала
 * сплющила бы первые уровни. Заполненность нити при этом честная —
 * интерполируется по баллам внутри своего отрезка (threadProgress).
 */
export function KarmaJourney({
  levels,
  rewards,
  points,
  className,
}: {
  levels: JourneyLevel[];
  rewards: JourneyReward[];
  /** Баллы покупателя. undefined — гость: пути без личного прогресса. */
  points?: number;
  className?: string;
}) {
  const sortedLevels = [...levels].sort((a, b) => a.fromKarma - b.fromKarma);
  if (sortedLevels.length === 0) return null;

  const hasPoints = typeof points === "number";
  const balance = points ?? 0;
  const currentLevel = hasPoints
    ? [...sortedLevels].reverse().find((level) => balance >= level.fromKarma) ?? sortedLevels[0]!
    : null;

  return (
    <section className={cn("overflow-hidden rounded-[32px] border border-gold/25 bg-paper-2 shadow-l", className)}>
      {/* Шапка: баланс и текущий уровень */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-hair-soft bg-gradient-to-br from-tint-cream via-paper-2 to-tint-lavender px-5 py-6 sm:px-8">
        <div>
          <span className="text-micro font-bold uppercase tracking-[0.2em] text-cherry">Karma Club</span>
          {hasPoints ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <b className="text-[40px] font-bold leading-none tracking-[-0.04em] sm:text-[52px]">{balance.toLocaleString("ru-RU")}</b>
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
        <LevelPath levels={sortedLevels} points={points} />

        {rewards.length > 0 && (
          <div className="mt-8 border-t border-hair-soft pt-7">
            <RewardPath rewards={rewards} points={points} />
          </div>
        )}
      </div>
    </section>
  );
}
