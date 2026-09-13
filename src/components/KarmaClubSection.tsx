import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ASSETS } from "@/lib/assets";
import { KarmaClubBoard } from "@/components/KarmaClubBoard";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { KarmaClubShowcase } from "@/components/KarmaClubShowcase";

export async function KarmaClubSection({
  compact = false,
  embedded = false,
}: {
  compact?: boolean;
  embedded?: boolean;
}) {
  const [levels, rewards] = await Promise.all([
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
    db.karmaReward.findMany({ where: { isActive: true }, orderBy: { costPoints: "asc" } }),
  ]);
  if (levels.length === 0) return null;

  const levelData = levels.map((l) => ({
    key: l.key,
    name: l.name,
    fromKarma: l.fromKarma,
    toKarma: l.toKarma,
    icon: l.icon,
    perk: l.perk,
  }));
  const rewardData = rewards.map((r) => ({
    id: r.id,
    costPoints: r.costPoints,
    title: r.title,
    description: r.description,
  }));

  // На главной — только тизер, полный клуб живёт на своей странице.
  if (compact) {
    return (
      <section className="relative overflow-hidden rounded-[32px] border border-hair bg-gradient-to-br from-tint-cream via-tint-lavender to-tint-plum p-8 md:p-12">
        <BackgroundFootage src={ASSETS.animations.sakuraPetals} opacity={0.3} />
        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-ink-3">
              Karma Club
            </span>
            <h2 className="mt-4 max-w-[16ch] font-sans text-[32px] leading-[1.1] tracking-tight md:text-[42px]">
              Делай добро. Получай вкусное.
            </h2>
            <p className="mt-4 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">
              Баллы за каждый заказ, четыре уровня и награды — от напитка в подарок
              до фирменного сета от шефа.
            </p>
            <Link
              href="/promotions#karma-club"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-plum-deep px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#F7EFF4] transition hover:opacity-90"
            >
              В Karma Club →
            </Link>
          </div>
          <Image
            src={ASSETS.mascots.catIdle}
            alt=""
            aria-hidden
            width={220}
            height={220}
            className="mx-auto w-[150px] object-contain md:w-[200px]"
          />
        </div>
      </section>
    );
  }

  if (embedded) {
    return (
      <KarmaClubShowcase levels={levelData} rewards={rewardData} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] border border-hair bg-gradient-to-br from-tint-cream via-tint-sakura to-tint-lavender px-6 py-10 md:px-14 md:py-14">
        <BackgroundFootage src={ASSETS.animations.sakuraPetals} opacity={0.4} priority />

        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[auto_1fr_auto]">
          {/* Вертикальная японская надпись и печать — слева, тихо */}
          <div className="hidden flex-col items-center gap-4 md:flex">
            <span
              aria-hidden
              className="text-[15px] tracking-[0.42em] text-ink/40 [writing-mode:vertical-rl]"
            >
              良いカルマ
            </span>
            <Image
              src={ASSETS.decor.hanko}
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="w-9 object-contain opacity-60"
            />
          </div>

          <div className="text-center md:text-left">
            <Image
              src={ASSETS.mascots.catPaw}
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="mx-auto mb-3 w-8 object-contain opacity-70 md:mx-0"
            />
            <h1 className="font-sans text-[42px] uppercase leading-none tracking-[0.06em] md:text-[64px]">
              Karma Club
            </h1>
            <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.2em] text-ink-2">
              Делай добро. Получай вкусное.
            </p>
          </div>

          <Image
            src={ASSETS.mascots.catIdle}
            alt="Кот Good Karma — маскот клуба"
            width={280}
            height={280}
            priority
            className="mx-auto w-[190px] object-contain md:w-[250px]"
          />
        </div>

        <Image
          src={ASSETS.decor.sakuraBranch}
          alt=""
          aria-hidden
          width={200}
          height={200}
          className="pointer-events-none absolute -left-6 bottom-0 w-[130px] object-contain opacity-45"
        />
      </section>

      <KarmaClubBoard levels={levelData} rewards={rewardData} />

      {/* ── ФИНАЛЬНЫЙ CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] bg-plum-deep px-7 py-9 text-[#F4ECF2] md:px-12 md:py-11">
        <Image
          src={ASSETS.backgrounds.darkPlumPattern}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="pointer-events-none object-cover opacity-[0.15]"
        />
        <div className="relative grid grid-cols-1 gap-7 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10">
          <h2 className="max-w-[12ch] font-sans text-[26px] leading-tight md:text-[30px]">
            Карма — это больше, чем баллы
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Баллы", "За каждый заказ"],
              ["Уровни", "Копите и открывайте"],
              ["Награды", "Обменивайте баллы"],
              ["Бонусы", "Эксклюзивно для клуба"],
            ].map(([title, text]) => (
              <div key={title}>
                <b className="block text-[13px] font-bold uppercase tracking-[0.12em] text-[#F7D9A6]">
                  {title}
                </b>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-[#F4ECF2]/70">
                  {text}
                </span>
              </div>
            ))}
          </div>

          <Image
            src={ASSETS.mascots.catBowl}
            alt=""
            aria-hidden
            width={140}
            height={140}
            className="pointer-events-none mx-auto w-[100px] object-contain md:mx-0"
          />
        </div>
      </section>
    </div>
  );
}
