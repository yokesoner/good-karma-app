import Link from "next/link";
import { KarmaPass } from "@/components/KarmaPass";
import { KarmaJourney } from "@/components/KarmaJourney";
import { ArrowUpRight } from "@/components/icons";
import type { KarmaLevel, KarmaReward } from "@/lib/karma";

type ShowcaseLevel = KarmaLevel & { discountPct: number | null; discountsPerWeek: number | null };

export function KarmaClubShowcase({
  levels,
  rewards,
  points,
}: {
  levels: ShowcaseLevel[];
  rewards: KarmaReward[];
  /** Баллы вошедшего покупателя; null — гость. */
  points?: number | null;
}) {
  return (
    <section id="karma-club" className="scroll-mt-24 pb-10 pt-4 md:pb-16 md:pt-6">
      <div className="club-showcase relative isolate overflow-hidden rounded-[32px] border border-gold/25 bg-paper-2 p-5 shadow-l sm:p-8 lg:p-12">
        <svg aria-hidden viewBox="0 0 1200 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full text-gold/25" fill="none">
          <path d="M680 0 651 82 704 156 658 252 731 350 698 442 760 600M704 156 860 137 993 195 1200 166" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="relative grid min-w-0 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Good Karma Club · 良いカルマ</span>
            <h2 className="mt-4 max-w-[20ch] text-[28px] font-bold leading-[1.04] tracking-[-0.04em] sm:text-[42px]">У каждого визита<br />есть продолжение.</h2>
            <p className="mt-5 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">Любимые блюда приносят баллы. Баллы поднимают уровень, а уровень даёт скидку на заказ несколько раз в неделю.</p>
            <div className="mt-6 flex items-center gap-4 border-y border-gold/20 py-4">
              <b className="shrink-0 text-[27px] tracking-tight">10 ₽ <span className="text-gold">→</span> 1</b>
              <span className="max-w-[18ch] text-[11px] leading-relaxed text-ink-2">балл кармы за заказ</span>
            </div>
            <Link href="/profile" className="mt-6 inline-flex min-h-12 items-center justify-between gap-6 rounded-full bg-btn px-6 py-3 text-[11px] font-bold text-btn-fg shadow-m transition hover:shadow-l motion-safe:hover:-translate-y-0.5">Открыть мою карту <ArrowUpRight className="text-[14px]" /></Link>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-2">Личный баланс и история — в профиле.</p>
          </div>
          <div className="min-w-0 lg:pl-4">
            <KarmaPass preview points={0} level={levels[0]?.name ?? "Seed"} compact className="mx-auto" />
            <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-2">Образец оформления. Здесь нет личных данных и баланса.</p>
          </div>
        </div>
      </div>

      {/* Один блок на оба пути: уровни сверху, подарки за баллы ниже. */}
      <KarmaJourney
        className="mt-6"
        levels={levels.map((l) => ({
          key: l.key,
          name: l.name,
          fromKarma: l.fromKarma,
          icon: l.icon,
          perk: l.perk,
          discountPct: l.discountPct,
          discountsPerWeek: l.discountsPerWeek,
        }))}
        rewards={rewards.map((r) => ({ id: r.id, costPoints: r.costPoints, title: r.title }))}
        points={typeof points === "number" ? points : undefined}
      />
    </section>
  );
}
