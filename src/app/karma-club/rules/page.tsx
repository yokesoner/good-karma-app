import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDiscount } from "@/lib/money";

export const metadata: Metadata = {
  title: "Правила Karma Club",
  alternates: { canonical: "/karma-club/rules" },
};

// Не статичный текст — таблица ниже собрана из реальных настроек наград
// в БД (лимит в неделю, минимальный уровень), чтобы не разъезжаться с тем,
// что реально настроено в админке.
export default async function KarmaClubRulesPage() {
  const rewards = await db.karmaReward.findMany({
    where: { isActive: true },
    orderBy: { costPoints: "asc" },
    include: { minLevel: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-wrap px-5 py-10 md:px-16">
      <div className="rounded-l border border-hair bg-paper-2 p-6 md:p-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
          Karma Club
        </span>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight md:text-[32px]">
          Правила использования подарков
        </h1>

        <div className="mt-8 flex flex-col gap-6 text-[14px] leading-relaxed text-ink-2">
          <section>
            <h2 className="text-[16px] font-bold text-ink">Как это работает</h2>
            <p className="mt-2">
              Карма-баллы начисляются за оформленные заказы и обмениваются на подарки —
              товары или личные скидки — в личном кабинете. Доступность подарка решает
              текущий баланс баллов: подарки переиспользуемые, набрали баллы ещё раз —
              можно обменять снова, разового «получено навсегда» нет.
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">Товар или скидка</h2>
            <p className="mt-2">
              Подарок-товар добавляется в корзину и списывает баллы при оформлении заказа —
              если заказ не довели до конца, баллы остаются нетронутыми. Подарок-скидка
              списывает баллы сразу при обмене и выдаёт личную скидку, которую можно
              применить на чекауте вместо промокода (одновременно оба не действуют).
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">Уровень и лимит обменов</h2>
            <p className="mt-2">
              У части подарков есть дополнительные условия — независимо от баланса баллов:
              минимальный уровень клуба и/или ограничение, сколько раз в неделю можно
              обменивать именно этот подарок. Ниже — актуальный список.
            </p>
            {rewards.length === 0 ? (
              <p className="mt-4 text-ink-3">Подарков пока нет.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-hair">
                <table className="w-full min-w-[420px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-hair bg-paper-3 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">
                      <th className="px-4 py-3">Подарок</th>
                      <th className="px-4 py-3">Стоимость</th>
                      <th className="px-4 py-3">Лимит в неделю</th>
                      <th className="px-4 py-3">Минимальный уровень</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map((r) => (
                      <tr key={r.id} className="border-b border-hair-soft last:border-b-0">
                        <td className="px-4 py-3 font-semibold text-ink">
                          {r.title}
                          {r.kind === "DISCOUNT" && (
                            <span className="ml-2 text-[11px] font-normal text-mint-deep">
                              {formatDiscount(r.discountType!, r.discountPct ?? 0, r.discountFixedCents ?? 0)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">{r.costPoints.toLocaleString("ru-RU")} баллов</td>
                        <td className="px-4 py-3">{r.maxRedemptionsPerWeek ? `до ${r.maxRedemptionsPerWeek}` : "без ограничения"}</td>
                        <td className="px-4 py-3">{r.minLevel?.name ?? "без ограничения"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">Общее</h2>
            <p className="mt-2">
              Баллы не являются денежным средством, не продаются, не передаются другим
              пользователям и не подлежат обмену на деньги. Список подарков и условия
              обмена может обновляться — актуальная версия всегда здесь.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
