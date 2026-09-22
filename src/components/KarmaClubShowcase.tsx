import Link from "next/link";
import { KarmaPass } from "@/components/KarmaPass";
import { KarmaClubBoard } from "@/components/KarmaClubBoard";
import { LevelIcon } from "@/components/LevelIcon";
import { ArrowUpRight } from "@/components/icons";
import type { KarmaLevel, KarmaReward } from "@/lib/karma";

export function KarmaClubShowcase({ levels, rewards }: { levels: KarmaLevel[]; rewards: KarmaReward[] }) {
  const sortedRewards = [...rewards].sort((a, b) => a.costPoints - b.costPoints);

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
            <p className="mt-5 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">Любимые блюда приносят баллы. Баллы открывают новые уровни и подарки от кухни.</p>
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
        <div className="relative mt-9 grid grid-cols-2 gap-3 border-t border-gold/20 pt-7 sm:grid-cols-3 md:grid-cols-4">
          {levels.map((level, index) => (
            <article key={level.key} className="min-w-0 rounded-[20px] border border-hair-soft bg-paper/70 p-4">
              <div className="flex items-center justify-between gap-2"><LevelIcon name={level.icon} className="h-6 w-6 text-cherry" /><span className="text-[9px] tracking-widest text-ink-3">0{index + 1}</span></div>
              <h3 className="mt-4 break-words text-[14px] font-bold">{level.name}</h3>
              <p className="mt-1 text-[11px] text-ink-2">от {level.fromKarma.toLocaleString("ru-RU")} баллов</p>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-2">{level.perk}</p>
            </article>
          ))}
        </div>
      </div>

      {sortedRewards.length > 0 && <section className="mt-9" aria-label="Подарки клуба">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><h3 className="text-[26px] font-bold tracking-tight">Приятные поводы вернуться</h3><Link href="/profile" className="inline-flex min-h-11 items-center text-[12px] font-semibold text-cherry">Мои награды <ArrowUpRight className="ml-2 text-[14px]" /></Link></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedRewards.map((reward, index) => <article key={reward.id} className="club-reward relative min-w-0 overflow-hidden rounded-[24px] border border-gold/20 bg-paper-2 p-6 shadow-s">
            <span aria-hidden className="absolute right-5 top-4 text-[36px] font-bold text-gold/15">{String(index + 1).padStart(2, "0")}</span>
            <span className="relative text-[11px] font-bold text-cherry">{reward.costPoints.toLocaleString("ru-RU")} баллов</span>
            <h4 className="relative mt-4 text-[17px] font-bold leading-snug">{reward.title}</h4>
            <p className="relative mt-2 text-[12px] leading-relaxed text-ink-2">{reward.description}</p>
          </article>)}
        </div>
      </section>}

      <details className="club-demo mt-7 rounded-[24px] border border-hair bg-paper-2 p-4 sm:p-6">
        <summary className="cursor-pointer rounded-xl py-2 text-[14px] font-semibold"><span className="mr-2 inline-block rounded-full bg-tint-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Демо</span>Посмотреть, как работают уровни</summary>
        <p className="mb-5 mt-3 max-w-[65ch] text-[13px] leading-relaxed text-ink-2">Учебный пример: меняйте количество баллов и смотрите доступные подарки. Действия здесь не меняют вашу карту и не оформляют награды.</p>
        <KarmaClubBoard levels={levels} rewards={rewards} />
      </details>
    </section>
  );
}
