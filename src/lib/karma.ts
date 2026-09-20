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

export type KarmaSnapshot = {
  points: number;
  level: KarmaLevel;
  nextLevel: KarmaLevel | null;
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
// src/server/karmaRewards.ts — там же level-gate наград).
export function pickLevel(points: number, levels: KarmaLevel[]): KarmaLevel | null {
  const first = levels[0];
  if (!first) return null;
  return levels.find((l) => points >= l.fromKarma && points < l.toKarma) ?? levels[levels.length - 1] ?? first;
}

/** Всё состояние клуба выводится из одного числа — количества баллов. */
export function karmaSnapshot(
  points: number,
  levels: KarmaLevel[],
  rewards: KarmaReward[],
): KarmaSnapshot | null {
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
