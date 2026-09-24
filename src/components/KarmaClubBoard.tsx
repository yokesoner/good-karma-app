"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ASSETS } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { LevelIcon } from "@/components/LevelIcon";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { RewardsPath } from "@/components/RewardsPath";
import {
  karmaSnapshot,
  type KarmaLevel,
  type KarmaReward,
} from "@/lib/karma";

type HistoryEntry = { id: string; label: string; date: string; points: number };

// Демо-история. Появится настоящей, когда будет вход по телефону —
// таблица KarmaLedgerEntry в схеме уже готова её принять.
const DEMO_HISTORY: HistoryEntry[] = [
  { id: "h1", label: "Заказ №GK-12547", date: "12 мая", points: 120 },
  { id: "h2", label: "Заказ №GK-12488", date: "10 мая", points: 80 },
  { id: "h3", label: "Ролл Филадельфия", date: "4 мая", points: -1500 },
];

export function KarmaClubBoard({
  levels,
  rewards,
}: {
  levels: KarmaLevel[];
  rewards: KarmaReward[];
}) {
  // Этот блок изолирован от профиля: ползунок меняет только учебный пример.
  const [points, setPoints] = useState(860);
  const [claimed, setClaimed] = useState<string[]>([]);

  const snap = karmaSnapshot(points, levels, rewards);
  if (!snap) return null;

  const sortedRewards = [...rewards].sort((a, b) => a.costPoints - b.costPoints);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-gold/30 bg-tint-gold px-4 py-3 text-[12px] leading-relaxed text-ink">
        <b>Демонстрация клуба.</b> Баллы, награды и история ниже — пример. <Link href="/profile" className="font-semibold underline underline-offset-4">Личная карта находится в профиле.</Link>
      </div>
      {/* ── СТАТУС ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-gradient-to-br from-[#FCF9F4] via-[#F7EFF2] to-[#E9F1EC] p-7 text-[#3A2A35] shadow-[0_28px_80px_-48px_rgba(73,48,68,.52)] md:p-10">
        <Image
          src={ASSETS.backgrounds.darkPlumPattern}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="pointer-events-none object-cover opacity-[0.045] mix-blend-multiply"
        />
        <BackgroundFootage src={ASSETS.animations.goldParticles} opacity={0.13} className="mix-blend-multiply" />

        <div className="relative grid min-w-0 grid-cols-1 gap-7 xl:grid-cols-[auto_1fr_auto] xl:items-center xl:gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#786672]">
              Баллы в примере
            </span>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <b className="font-sans text-[44px] leading-none sm:text-[60px]">{snap.points}</b>
              <span className="text-[13px] text-[#786672]">баллов</span>
            </div>
          </div>

          <div className="min-w-0 xl:px-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#786672]">
              Уровень в примере
            </span>
            <div className="mt-2 flex items-center gap-3">
              <LevelIcon name={snap.level.icon} className="h-7 w-7 text-[#9A536E]" />
              <b className="font-sans text-[22px] uppercase leading-none tracking-wide sm:text-[30px]">
                {snap.level.name}
              </b>
            </div>
            <p className="mt-2 text-[13px] text-[#786672]">
              {snap.nextLevel
                ? "Ты на шаг ближе к следующему уровню"
                : "Высший уровень клуба — спасибо, что вы с нами"}
            </p>

            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-white/75 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#9A536E] via-[#D58D9F] to-[#C8A86A] transition-[width] duration-700 ease-out"
                  style={{ width: `${snap.progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-right text-[12px] tabular-nums text-[#786672]">
                {snap.points} / {snap.nextLevel ? snap.nextLevel.fromKarma : snap.level.toKarma}
              </p>
            </div>
          </div>

          <div className="xl:text-right">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#786672]">
              До следующего уровня
            </span>
            <div className="mt-2">
              <b className="font-sans text-[44px] leading-none md:text-[54px]">
                {snap.nextLevel ? snap.pointsToNext : "—"}
              </b>
              {snap.nextLevel && (
                <span className="ml-2 text-[13px] text-[#786672]">баллов</span>
              )}
            </div>
          </div>
        </div>

        {/* Демо-ползунок: до появления авторизации баланс задаётся вручную */}
        <div className="relative mt-8 border-t border-[#493044]/10 pt-5">
          <label className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#786672]">
              Демо: сколько у вас баллов
            </span>
            <input
              type="range"
              min={0}
              max={3200}
              step={20}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="h-11 w-full min-w-0 flex-1 basis-[200px] accent-[#9A536E]"
              aria-label="Демонстрационное количество баллов"
            />
          </label>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* ── НАГРАДЫ: путь, а не сетка карточек ──────────────── */}
        <section className="min-w-0 rounded-[28px] border border-hair bg-paper-2 p-4 sm:p-7">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-sans text-[26px] tracking-tight md:text-[30px]">
              Награды Karma Club
            </h2>
            <span className="text-[11.5px] text-ink-3">
              Двигайте ползунок выше — дорожка открывается вместе с баллами
            </span>
          </div>
          <p className="mb-2 text-[12.5px] text-ink-2">Нажмите на открывшуюся остановку, чтобы получить награду в демо.</p>
          <RewardsPath rewards={sortedRewards} points={points} claimedIds={claimed} onStopClick={(id) => setClaimed((c) => [...c, id])} />
        </section>

        {/* ── БОКОВАЯ КОЛОНКА ──────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <section className="relative overflow-hidden rounded-[28px] border border-hair bg-paper-2 p-7">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
              Что такое карма
            </h3>
            <p className="mt-3 max-w-[28ch] text-[13.5px] leading-relaxed text-ink-2">
              Копите баллы за заказы и обменивайте их на вкусные награды и особые привилегии.
            </p>
            <p className="mt-4 text-[13px] font-semibold">1 балл за каждые 10 ₽</p>
            <Image
              src={ASSETS.decor.sakuraPetals}
              alt=""
              aria-hidden
              width={80}
              height={80}
              className="pointer-events-none absolute -bottom-3 right-2 w-16 object-contain opacity-45"
            />
          </section>

          {snap.nextReward && (
            <section className="relative overflow-hidden rounded-[28px] border border-cherry/25 bg-gradient-to-br from-tint-sakura to-tint-peach p-7">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
                Ближайшая награда
              </h3>
              <div className="mt-3 flex items-baseline gap-2">
                <b className="font-sans text-[32px] leading-none">
                  {snap.nextReward.costPoints}
                </b>
                <span className="text-[12px] text-ink-3">баллов</span>
              </div>
              <p className="mt-1 text-[14px] font-semibold">{snap.nextReward.title}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cherry to-[#D58D9F] transition-[width] duration-700"
                  style={{
                    width: `${Math.round((points / snap.nextReward.costPoints) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[12px] text-ink-2">
                Осталось {snap.pointsToNextReward} баллов
              </p>
            </section>
          )}

          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-tint-plum to-tint-sakura p-7">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
              Повышай уровень
            </h3>
            <p className="mt-3 max-w-[26ch] text-[13.5px] leading-relaxed text-ink-2">
              С каждым уровнем вас ждут больше бонусов, подарков и приятных сюрпризов.
            </p>
            <Link
              href="/menu"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-plum/30 bg-white/40 px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] transition hover:border-plum"
            >
              Собрать заказ →
            </Link>
            <Image
              src={ASSETS.mascots.catBowl}
              alt=""
              aria-hidden
              width={120}
              height={120}
              className="pointer-events-none absolute -bottom-1 right-2 w-[84px] object-contain"
            />
          </section>
        </div>
      </div>

      {/* ── УРОВНИ И ИСТОРИЯ ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="min-w-0 rounded-[28px] border border-hair bg-paper-2 p-4 sm:p-7">
          <h2 className="mb-7 font-sans text-[26px] tracking-tight">Уровни Karma Club</h2>
          <div className="relative grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4">
            {/* Соединительная линия читается только в один ряд — если уровней
                станет больше 4 (например, из будущей админки), она молча
                скрывается, а не режет вторую строку карточек. */}
            {levels.length <= 4 && (
              <span
                aria-hidden
                className="absolute left-[10%] right-[10%] top-7 hidden h-px bg-hair md:block"
              />
            )}
            {levels.map((lvl) => {
              const reached = points >= lvl.fromKarma;
              const active = lvl.key === snap.level.key;
              return (
                <div key={lvl.key} className="relative flex flex-1 flex-col items-center text-center">
                  <span
                    className={cn(
                      "grid h-14 w-14 place-items-center rounded-full border transition-all duration-500",
                      active
                        ? "scale-110 border-transparent bg-plum-deep text-[#F7D9A6] shadow-m"
                        : reached
                          ? "border-cherry/30 bg-tint-sakura text-cherry"
                          : "border-hair bg-paper text-ink-3",
                    )}
                  >
                    <LevelIcon name={lvl.icon} className="h-6 w-6" />
                  </span>
                  <b
                    className={cn(
                      "mt-3 text-[12px] font-bold uppercase tracking-[0.12em]",
                      active && "text-cherry",
                    )}
                  >
                    {lvl.name}
                  </b>
                  <span className="mt-1 text-[11.5px] text-ink-3">{lvl.fromKarma} баллов</span>
                </div>
              );
            })}
          </div>
          <p className="mt-7 border-t border-hair-soft pt-5 text-[13px] leading-relaxed text-ink-2">
            <b className="font-semibold">{snap.level.name}:</b> {snap.level.perk}
          </p>
        </section>

        <section className="rounded-[28px] border border-hair bg-paper-2 p-7 md:p-9">
          <h2 className="mb-6 font-sans text-[26px] tracking-tight">Пример истории</h2>
          <div className="flex flex-col">
            {DEMO_HISTORY.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 border-b border-hair-soft py-3.5 last:border-b-0"
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-2 w-2 flex-none rounded-full",
                    entry.points > 0 ? "bg-mint-deep" : "bg-cherry",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]">{entry.label}</p>
                  <p className="text-[11.5px] text-ink-3">{entry.date}</p>
                </div>
                <b
                  className={cn(
                    "text-[13.5px] tabular-nums",
                    entry.points > 0 ? "text-mint-deep" : "text-cherry",
                  )}
                >
                  {entry.points > 0 ? "+" : ""}
                  {entry.points}
                </b>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[11.5px] leading-relaxed text-ink-3">
            Демонстрационные данные. Настоящая история появится после входа по номеру телефона.
          </p>
        </section>
      </div>
    </div>
  );
}
