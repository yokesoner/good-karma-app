"use client";

import { cn } from "@/lib/cn";
import { Bag, Check } from "@/components/icons";
import { BrandMark } from "@/components/BrandMark";
import type { KarmaReward } from "@/lib/karma";

/**
 * «Дорожка наград» — тот же приём, что в приложениях Burger King (Coin
 * Path) или KFC: не плоская сетка карточек, а один путь слева направо,
 * где награды расставлены на расстоянии друг от друга пропорционально
 * их стоимости, дорожка подсвечивается по мере роста баллов, а «вы
 * здесь» — отдельная метка поверх неё. Награды через одну сдвинуты вверх/
 * вниз от центральной линии — зигзаг, а не ряд одинаковых точек, это и
 * читается более «игровым путешествием», а не таблицей цен.
 *
 * Два режима:
 * — обычный (points/claimedIds/onStopClick заданы) — живой прогресс, как
 *   в демо-калькуляторе на /promotions или будущем профиле;
 * — showcase — витрина для гостя без личного баланса (сейчас — основной
 *   блок "Приятные поводы вернуться" на /promotions): все остановки
 *   показаны открытыми, метки "вы здесь" нет, клик никуда не ведёт.
 */
export function RewardsPath({
  rewards,
  points,
  claimedIds = [],
  onStopClick,
  showcase = false,
}: {
  rewards: KarmaReward[];
  points?: number;
  claimedIds?: string[];
  /** Клик по достижимой ещё не полученной награде — например, «получить» в демо. */
  onStopClick?: (rewardId: string) => void;
  showcase?: boolean;
}) {
  const sorted = [...rewards].sort((a, b) => a.costPoints - b.costPoints);
  const maxCost = Math.max(...sorted.map((r) => r.costPoints), 1);
  const effectivePoints = showcase ? maxCost : (points ?? 0);
  // Небольшой запас справа, чтобы последняя остановка не упиралась в край
  // дорожки, и метка «вы здесь» не вылезала за 100%, даже когда баллов
  // больше, чем стоит самая дорогая награда.
  const trackMax = Math.max(maxCost * 1.15, effectivePoints * 1.02, 1);
  const markerPct = Math.min(100, (effectivePoints / trackMax) * 100);
  const trackWidth = Math.max(640, sorted.length * 176);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="relative h-[220px]" style={{ minWidth: `${trackWidth}px` }}>
        <div className="absolute inset-x-8 top-[104px] h-2 -translate-y-1/2 overflow-hidden rounded-full bg-hair-soft">
          <div
            className="h-full rounded-full bg-gradient-to-r from-plum-deep via-cherry to-gold transition-[width] duration-700 ease-out"
            style={{ width: `${markerPct}%` }}
          />
        </div>

        {/* «Вы здесь» — плывёт по дорожке вместе с баллами; в showcase не нужна, показывать нечего */}
        {!showcase && (
          <div
            className="absolute top-[104px] z-20 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out"
            style={{ left: `${markerPct}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-paper bg-plum-deep text-[#F7D9A6] shadow-m">
                <BrandMark className="h-5 w-5" />
              </span>
              <span className="mt-1 whitespace-nowrap rounded-full bg-plum-deep px-2 py-0.5 text-[9px] font-bold text-white shadow-s">
                {effectivePoints.toLocaleString("ru-RU")}
              </span>
            </div>
          </div>
        )}

        {sorted.map((reward, i) => {
          const pct = (reward.costPoints / trackMax) * 100;
          const claimed = claimedIds.includes(reward.id);
          const reached = showcase || effectivePoints >= reward.costPoints;
          const offsetUp = i % 2 === 0;

          return (
            <div
              key={reward.id}
              className="absolute top-[104px] z-10 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${pct}%`, transform: `translate(-50%, ${offsetUp ? "-58px" : "12px"})` }}
            >
              <button
                type="button"
                disabled={showcase || !reached || claimed}
                onClick={() => onStopClick?.(reward.id)}
                aria-label={`${reward.title} — ${reward.costPoints} баллов${claimed ? ", получено" : reached ? "" : ", ещё недоступно"}`}
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 shadow-s transition-all duration-300",
                  showcase && "cursor-default",
                  claimed
                    ? "border-mint-deep bg-mint-deep text-white"
                    : reached
                      ? cn("border-cherry bg-gradient-to-br from-cherry to-plum-deep text-white", !showcase && "hover:scale-110 active:scale-95")
                      : "border-dashed border-hair bg-paper text-ink-3",
                )}
              >
                {claimed ? <Check className="h-4 w-4" /> : <Bag className="h-4 w-4" />}
              </button>
              <span className={cn("mt-1.5 max-w-[92px] text-balance text-center text-[10px] font-semibold leading-tight", !reached && !claimed && "text-ink-3")}>
                {reward.title}
              </span>
              <span className="text-[9px] text-ink-3">{reward.costPoints.toLocaleString("ru-RU")} б.</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
