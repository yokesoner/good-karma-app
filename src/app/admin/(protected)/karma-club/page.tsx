import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { deleteAdminKarmaLevel, deleteAdminKarmaReward } from "@/server/adminKarmaClub";

export const metadata: Metadata = { title: "Karma Club — админка Гуд Карма" };

const PERK_KIND_BADGE: Record<string, string> = {
  NONE: "Без привилегии",
  MILESTONE_GIFT: "Подарок к заказу",
  CLAIMABLE: "По запросу",
  ALWAYS_DISCOUNT: "Авто-скидка",
};

export default async function AdminKarmaClubPage() {
  const [levels, rewards] = await Promise.all([
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" }, include: { perkProduct: { select: { name: true } } } }),
    db.karmaReward.findMany({
      orderBy: { costPoints: "asc" },
      include: { products: { include: { product: { select: { name: true } } } }, minLevel: { select: { name: true } } },
    }),
  ]);
  return (
    <div className="space-y-12">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Лояльность</p><h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-4xl">Karma Club</h1></div>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold">Уровни</h2><p className="mt-1 text-sm text-ink-2">Диапазоны статусов и их реальные привилегии</p></div><Link href="/admin/karma-club/levels/new" className="rounded-full bg-plum-deep px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить уровень</Link></div>
        <div className="mt-5 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
          {levels.map((level) => {
            const perkDetail =
              level.perkKind === "MILESTONE_GIFT"
                ? `${level.perkProduct?.name ?? "товар не выбран"} · каждый ${level.perkEveryNOrders}-й заказ`
                : level.perkKind === "ALWAYS_DISCOUNT"
                  ? `−${level.perkDiscountPct}% на каждый заказ`
                  : level.perkKind === "CLAIMABLE"
                    ? `раз в ${level.perkClaimEveryDays} дн.`
                    : null;
            return (
              <article key={level.key} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[1fr_150px_1fr_170px] md:items-center">
                <div><h3 className="font-semibold">{level.name}</h3><p className="mt-1 text-xs text-ink-3">{level.key} · иконка: {level.icon}</p></div>
                <p className="text-sm text-ink-2">{level.fromKarma}–{level.toKarma} баллов</p>
                <div>
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em] ${level.perkKind === "NONE" ? "bg-paper-3 text-ink-3" : "bg-tint-mint"}`}>{PERK_KIND_BADGE[level.perkKind]}</span>
                  {perkDetail && <p className="mt-1.5 text-xs text-ink-3">{perkDetail}</p>}
                </div>
                <div className="flex items-center justify-end gap-4"><Link href={`/admin/karma-club/levels/${level.key}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link><AdminDeleteButton identifier={level.key} label={level.name} action={deleteAdminKarmaLevel} /></div>
              </article>
            );
          })}
          {levels.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Уровней пока нет.</p>}
        </div>
      </section>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold">Награды</h2><p className="mt-1 text-sm text-ink-2">Обмен баллов на бонусы</p></div><Link href="/admin/karma-club/rewards/new" className="rounded-full bg-plum-deep px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить награду</Link></div>
        <div className="mt-5 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
          {rewards.map((reward) => {
            const details =
              reward.kind === "DISCOUNT"
                ? `Скидка ${reward.discountType === "FIXED" ? formatMoney(reward.discountFixedCents ?? 0) : `${reward.discountPct}%`}`
                : reward.products.length === 0
                  ? "Нет товаров — обменять нельзя"
                  : reward.products.map((p) => p.product.name).join(", ");
            const limits = [reward.minLevel ? `от уровня «${reward.minLevel.name}»` : null, reward.maxRedemptionsPerWeek ? `до ${reward.maxRedemptionsPerWeek}/нед.` : null].filter(Boolean).join(" · ");
            return (
              <article key={reward.id} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[1fr_130px_1fr_170px] md:items-center">
                <div><div className="flex items-center gap-2"><h3 className="font-semibold">{reward.title}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${reward.isActive ? "bg-tint-mint" : "bg-paper-3"}`}>{reward.isActive ? "АКТИВНА" : "ВЫКЛ"}</span></div>{limits && <p className="mt-1 text-xs text-ink-3">{limits}</p>}</div>
                <p className="text-sm font-semibold">{reward.costPoints} баллов</p>
                <div><p className="text-sm text-ink-2">{reward.description}</p><p className={`mt-1 text-xs ${reward.kind === "PRODUCT" && reward.products.length === 0 ? "text-cherry" : "text-ink-3"}`}>{details}</p></div>
                <div className="flex items-center justify-end gap-4"><Link href={`/admin/karma-club/rewards/${reward.id}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link><AdminDeleteButton identifier={reward.id} label={reward.title} action={deleteAdminKarmaReward} /></div>
              </article>
            );
          })}
          {rewards.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Наград пока нет.</p>}
        </div>
      </section>
    </div>
  );
}
