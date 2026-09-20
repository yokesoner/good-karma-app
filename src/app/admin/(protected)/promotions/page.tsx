import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { promotionStatus, type PromoStatus } from "@/lib/promoSchedule";
import { deleteAdminPromotion } from "@/server/adminPromotions";

export const metadata: Metadata = { title: "Акции — админка Гуд Карма" };

const STATUS_LABEL: Record<PromoStatus, string> = {
  active: "АКТИВНА СЕЙЧАС",
  scheduled: "ЖДЁТ ОКНА",
  expired: "ИСТЕКЛА",
  disabled: "ВЫКЛ",
};

const STATUS_CLASS: Record<PromoStatus, string> = {
  active: "bg-tint-mint",
  scheduled: "bg-tint-cream",
  expired: "bg-tint-blush",
  disabled: "bg-paper-3",
};

const RECURRENCE_LABEL: Record<string, string> = {
  NONE: "",
  DAILY: "Каждый день",
  WEEKLY: "По дням недели",
  MONTHLY: "Раз в месяц",
};

function recurrenceSummary(promotion: { recurrence: string; recurrenceStartTime: string | null; recurrenceEndTime: string | null }) {
  const label = RECURRENCE_LABEL[promotion.recurrence];
  if (!label) return null;
  const time = promotion.recurrenceStartTime && promotion.recurrenceEndTime ? ` ${promotion.recurrenceStartTime}–${promotion.recurrenceEndTime}` : "";
  return `${label}${time}`;
}

export default async function AdminPromotionsPage() {
  const promotions = await db.promotion.findMany({ orderBy: [{ isActive: "desc" }, { code: "asc" }] });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Маркетинг</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Акции</h1><p className="mt-2 text-sm text-ink-2">{promotions.length} промокодов</p></div><div className="flex gap-3"><Link href="/admin/promotions/banner" className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] hover:border-plum">Главный баннер</Link><Link href="/admin/promotions/new" className="rounded-full bg-plum-deep px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить акцию</Link></div></div>
      <div className="mt-8 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
        {promotions.map((promotion) => {
          const status = promotionStatus(promotion);
          const recurrence = recurrenceSummary(promotion);
          return (
            <article key={promotion.code} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[1fr_150px_1fr_170px] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{promotion.title}</h2>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                </div>
                <p className="mt-1 text-xs text-ink-3">{promotion.code}{recurrence ? ` · ${recurrence}` : ""}</p>
              </div>
              <p className="text-sm text-ink-2">{promotion.type === "PERCENT" ? `${promotion.discountPct}%` : formatMoney(promotion.discountFixedCents)}</p>
              <p className="text-sm text-ink-2">Заказ от {formatMoney(promotion.minOrderCents)}</p>
              <div className="flex items-center justify-end gap-4"><Link href={`/admin/promotions/${encodeURIComponent(promotion.code)}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link><AdminDeleteButton identifier={promotion.code} label={promotion.code} action={deleteAdminPromotion} /></div>
            </article>
          );
        })}
        {promotions.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Акций пока нет.</p>}
      </div>
    </div>
  );
}
