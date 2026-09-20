import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { notifyAdmins } from "@/server/adminNotify";

const WARNING_WINDOW_HOURS = 24;

// Единственный планировщика на VPS пока нет (см. DEPLOYMENT.md), поэтому
// эта функция запускается двумя способами: (1) не блокируя рендер, при
// каждом заходе в /admin (src/app/admin/(protected)/layout.tsx) — работает
// уже сейчас без какой-либо настройки сервера; (2) scripts/check-promo-expiry.ts
// — тот же вызов напрямую из cron после деплоя, для честной доставки
// уведомления даже в день, когда никто не открывал /admin.
//
// expiryWarnedAt дедуплицирует: акция предупреждает о себе один раз, а не
// при каждом визите в админку, пока admin её не отредактирует заново
// (promotionData в adminPromotions.ts сбрасывает поле в null при сохранении).
export async function checkAndNotifyExpiringPromotions() {
  const now = new Date();
  const soon = new Date(now.getTime() + WARNING_WINDOW_HOURS * 60 * 60 * 1000);

  const expiring = await db.promotion.findMany({
    where: {
      isActive: true,
      expiryWarnedAt: null,
      activeTo: { not: null, gte: now, lte: soon },
    },
  });
  if (expiring.length === 0) return;

  for (const promo of expiring) {
    const hoursLeft = Math.max(1, Math.round((promo.activeTo!.getTime() - now.getTime()) / (60 * 60 * 1000)));
    const text = [
      `⏳ Акция «${promo.title}» (${promo.code}) скоро закончится`,
      `Осталось примерно ${hoursLeft} ч. — до ${promo.activeTo!.toLocaleString("ru-RU")}`,
      promo.type === "PERCENT" ? `Скидка: ${promo.discountPct}%` : `Скидка: ${formatMoney(promo.discountFixedCents)}`,
    ].join("\n");
    await notifyAdmins(text);
    await db.promotion.update({ where: { code: promo.code }, data: { expiryWarnedAt: now } });
  }
}
