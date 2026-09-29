"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, Lock } from "@/components/icons";
import { PathBar, PathRail, PathStop, threadProgress, type PathNodeState } from "@/components/PathRail";
import { cn } from "@/lib/cn";

export type PathReward = {
  id: string;
  costPoints: number;
  title: string;
  description: string;
  /** Фото привязанного товара; null — у награды-скидки или без товара. */
  image: { url: string; alt: string } | null;
  /** «−20%» у награды-скидки, иначе null. */
  discountLabel: string | null;
  /** Награда доступна только с этого уровня. */
  minLevelName: string | null;
  /**
   * Почему награду нельзя взять, хотя баллов хватает (уровень ниже нужного,
   * недельный лимит обменов). Считает сервер — checkRewardEligibility.
   */
  restriction?: string | null;
};

type CardState = "reached" | "restricted" | "next" | "locked" | "guest";

/**
 * Путь подарков Karma Club: каждый подарок — карточка с фото на золотой
 * нити (каркас — PathRail). Приём «пути монет» из приложений Burger King и
 * KFC, но ценность подарка видна сразу — фото блюда, а не иконка сумки.
 *
 * На витрине открытый подарок ведёт в профиль; в самом профиле вместо
 * ссылки — настоящее действие (renderAction): в корзину, выбор варианта,
 * обмен на скидку.
 */
export function RewardPath({
  rewards,
  points,
  title = "Подарки за баллы",
  headingAs,
  renderAction,
}: {
  rewards: PathReward[];
  /** Баллы покупателя; undefined — гость, путь без личного прогресса. */
  points?: number;
  title?: string;
  headingAs?: "h2" | "h3";
  /** Действие открытого подарка (профиль). Без него — ссылка «Можно забрать». */
  renderAction?: (reward: PathReward) => React.ReactNode;
}) {
  const sorted = [...rewards].sort((a, b) => a.costPoints - b.costPoints);
  if (sorted.length === 0) return null;

  const hasPoints = typeof points === "number";
  const balance = points ?? 0;
  const nextIndex = hasPoints ? sorted.findIndex((r) => r.costPoints > balance) : -1;
  const next = nextIndex >= 0 ? sorted[nextIndex] : null;
  const reachedCount = hasPoints ? sorted.filter((r) => balance >= r.costPoints).length : 0;

  const subtitle = !hasPoints
    ? "Баллы копятся с каждого заказа и открывают подарки по пути. Уровень при обмене не теряется."
    : next
      ? `Открыто ${reachedCount} из ${sorted.length}. До «${next.title}» — ${(next.costPoints - balance).toLocaleString("ru-RU")} баллов.`
      : "Все подарки пути открыты — выбирайте любой.";

  return (
    <PathRail
      title={title}
      headingAs={headingAs}
      subtitle={subtitle}
      listLabel="Путь подарков"
      count={sorted.length}
      progress={hasPoints ? threadProgress(balance, sorted.map((r) => r.costPoints)) : 0}
    >
      {sorted.map((reward, index) => {
        const state: CardState = !hasPoints
          ? "guest"
          : balance >= reward.costPoints
            ? reward.restriction
              ? "restricted"
              : "reached"
            : index === nextIndex
              ? "next"
              : "locked";
        const previousCost = index > 0 ? sorted[index - 1]!.costPoints : 0;
        // Шкала «следующего» подарка — от предыдущей остановки до этой, а не от
        // нуля: иначе у дорогого подарка она почти заполнена ещё до первого.
        const nextProgress =
          state === "next" ? Math.max(0.04, Math.min(1, (balance - previousCost) / Math.max(1, reward.costPoints - previousCost))) : 0;
        const nodeState: PathNodeState =
          state === "reached" ? "done" : state === "next" ? "current" : state === "locked" || state === "restricted" ? "locked" : "neutral";

        return (
          <PathStop key={reward.id} index={index} node={{ state: nodeState }} progress={nextProgress} state={state}>
            <RewardCard reward={reward} index={index} state={state} balance={balance} renderAction={renderAction} />
          </PathStop>
        );
      })}
    </PathRail>
  );
}

function RewardCard({
  reward,
  index,
  state,
  balance,
  renderAction,
}: {
  reward: PathReward;
  index: number;
  state: CardState;
  balance: number;
  renderAction?: (reward: PathReward) => React.ReactNode;
}) {
  const cost = reward.costPoints.toLocaleString("ru-RU");
  const dim = state === "locked";

  return (
    <article
      className={cn(
        "path-card relative mt-3 flex w-full flex-1 flex-col overflow-hidden rounded-[24px] border bg-paper-2 transition duration-500",
        state === "reached" && "border-gold/55 shadow-s",
        state === "restricted" && "border-hair shadow-s",
        state === "next" && "border-cherry/35 shadow-m",
        state === "locked" && "border-hair",
        state === "guest" && "border-hair shadow-s",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {reward.image ? (
          <Image
            src={reward.image.url}
            alt={reward.image.alt}
            fill
            sizes="252px"
            className={cn(
              "object-cover transition duration-700 ease-out motion-safe:group-hover:scale-[1.06]",
              dim && "opacity-70 grayscale-[.65]",
            )}
          />
        ) : reward.discountLabel ? (
          <div className={cn("grid h-full place-items-center bg-gradient-to-br from-plum-deep via-[#5B3450] to-cherry", dim && "opacity-75 saturate-50")}>
            <span className="text-[56px] font-extrabold leading-none tracking-[-0.06em] text-[#FFF8F2]">{reward.discountLabel}</span>
          </div>
        ) : (
          <div className="grid h-full place-items-center bg-tint-gold text-gold">
            <Gift className="text-[44px]" strokeWidth={1.3} />
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-paper-2/90 px-2.5 py-1 text-caption font-bold tabular-nums text-ink shadow-s backdrop-blur-md">
          {cost} баллов
        </span>
        {reward.minLevelName && (
          <span className="absolute right-3 top-3 rounded-full bg-plum-deep/85 px-2.5 py-1 text-micro font-semibold text-[#FFF8F2] backdrop-blur-md">
            с уровня {reward.minLevelName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className={cn("line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em]", dim && "text-ink-2")}>{reward.title}</h4>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-3">{reward.description}</p>

        <div className="mt-auto pt-4">
          {state === "reached" &&
            (renderAction ? (
              renderAction(reward)
            ) : (
              <Link
                href="/profile#profile-rewards"
                className="inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-full bg-tint-gold px-4 text-[12px] font-bold text-ink transition hover:bg-gold/30"
              >
                Можно забрать
                <ArrowRight className="text-[14px] transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            ))}
          {state === "restricted" && (
            <p className="flex items-start gap-2 text-[12px] leading-snug text-cherry">
              <Lock className="mt-0.5 shrink-0 text-[13px]" />
              {reward.restriction}
            </p>
          )}
          {state === "next" && (
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2 text-[12px]">
                <span className="font-bold text-cherry">Следующий подарок</span>
                <span className="tabular-nums text-ink-2">ещё {(reward.costPoints - balance).toLocaleString("ru-RU")}</span>
              </div>
              <PathBar />
            </div>
          )}
          {state === "locked" && (
            <p className="text-[12px] text-ink-3">
              Откроется на <span className="font-semibold tabular-nums text-ink-2">{cost}</span> баллах
            </p>
          )}
          {state === "guest" && (
            <p className="text-[12px] font-semibold text-ink-2">{index === 0 ? "Первый подарок на пути" : `Шаг ${index + 1}`}</p>
          )}
        </div>
      </div>
    </article>
  );
}
