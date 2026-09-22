export type KarmaLevel = {
  key: string;
  name: string;
  fromKarma: number;
  toKarma: number;
  icon: string;
  perk: string;
};

export type KarmaReward = {
  id: string;
  costPoints: number;
  title: string;
  description: string;
};

export type RewardState = "LOCKED" | "AVAILABLE" | "CLAIMED";

export type KarmaSnapshot<L extends KarmaLevel = KarmaLevel> = {
  points: number;
  level: L;
  nextLevel: L | null;
  pointsToNext: number;
  progressPct: number;
  /** Ближайшая недоступная награда — «осталось совсем немного». */
  nextReward: KarmaReward | null;
  pointsToNextReward: number;
};

// levels должен быть отсортирован по fromKarma по возрастанию (так его и
// запрашивают все вызывающие — orderBy: { fromKarma: "asc" }). Вынесено
// отдельно от karmaSnapshot, чтобы ту же логику подбора уровня можно было
// переиспользовать на сервере (см. checkRewardEligibility в
// src/server/karmaRewards.ts, resolveLevelPerk в src/server/karmaLevels.ts —
// там же level-gate наград и разрешение реальной привилегии уровня).
//
// Generic по L (а не жёстко KarmaLevel) — вызывающие передают полный
// Prisma-тип уровня (с perkKind и остальными полями привилегии), и функция
// должна возвращать ЕГО ЖЕ, а не обрезать до этих шести полей: иначе
// вызывающий код, которому нужен, например, perkKind текущего уровня,
// терял бы его прямо на этом шаге.
export function pickLevel<L extends KarmaLevel>(points: number, levels: L[]): L | null {
  const first = levels[0];
  if (!first) return null;
  return levels.find((l) => points >= l.fromKarma && points < l.toKarma) ?? levels[levels.length - 1] ?? first;
}

/** Всё состояние клуба выводится из одного числа — количества баллов. */
export function karmaSnapshot<L extends KarmaLevel>(
  points: number,
  levels: L[],
  rewards: KarmaReward[],
): KarmaSnapshot<L> | null {
  const level = pickLevel(points, levels);
  if (!level) return null;

  const nextLevel = levels[levels.indexOf(level) + 1] ?? null;

  const ceiling = nextLevel ? nextLevel.fromKarma : level.toKarma;
  const span = Math.max(ceiling - level.fromKarma, 1);
  const progressPct = Math.min(100, Math.round(((points - level.fromKarma) / span) * 100));

  const sortedRewards = [...rewards].sort((a, b) => a.costPoints - b.costPoints);
  const nextReward = sortedRewards.find((r) => r.costPoints > points) ?? null;

  return {
    points,
    level,
    nextLevel,
    pointsToNext: nextLevel ? Math.max(0, nextLevel.fromKarma - points) : 0,
    progressPct,
    nextReward,
    pointsToNextReward: nextReward ? nextReward.costPoints - points : 0,
  };
}

export function rewardState(
  reward: KarmaReward,
  points: number,
  claimedIds: string[],
): RewardState {
  if (claimedIds.includes(reward.id)) return "CLAIMED";
  return points >= reward.costPoints ? "AVAILABLE" : "LOCKED";
}
