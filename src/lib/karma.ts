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

/** Всё состояние клуба выводится из одного числа — количества баллов. */
export function karmaSnapshot(
  points: number,
  levels: KarmaLevel[],
  rewards: KarmaReward[],
): KarmaSnapshot | null {
  const first = levels[0];
  if (!first) return null;

  const level =
    levels.find((l) => points >= l.fromKarma && points < l.toKarma) ??
    levels[levels.length - 1] ??
    first;
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
