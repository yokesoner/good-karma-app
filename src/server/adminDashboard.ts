import type { OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";

// Москва — без перехода на летнее время с 2014 года, поэтому смещение
// можно зашить как константу вместо честного расчёта через Intl на
// каждый вызов. Тот же часовой пояс кафе, что уже в src/lib/promoSchedule.ts —
// нужен здесь, чтобы "сегодня" и границы дней в графике не съезжали на
// сервере в другом часовом поясе после деплоя.
function cafeDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfCafeDay(now: Date): Date {
  return new Date(`${cafeDayKey(now)}T00:00:00+03:00`);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

// Отменённый заказ не "заработанные деньги" — сумма никогда не была
// получена. Единая проверка для всех агрегатов выручки ниже (сегодня,
// 7 дней, за всё время, график), чтобы не разъезжались по-разному.
const EARNED_WHERE = { status: { not: "CANCELLED" as const } };

export type OrderStatusCount = { status: OrderStatus; count: number };
export type DailyRevenuePoint = { dateKey: string; label: string; revenueCents: number };

export type AdminDashboardStats = {
  allTime: { count: number; revenueCents: number };
  today: { count: number; revenueCents: number };
  last7d: { count: number; revenueCents: number; avgCents: number; newCustomers: number };
  statusBreakdown30d: OrderStatusCount[];
  dailyRevenue: DailyRevenuePoint[];
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await requireAdmin();

  const now = new Date();
  const todayStart = startOfCafeDay(now);
  const since7d = new Date(now.getTime() - 7 * DAY_MS);
  const since30d = new Date(now.getTime() - 30 * DAY_MS);
  const sinceTrend = new Date(startOfCafeDay(now).getTime() - (TREND_DAYS - 1) * DAY_MS);

  const [allTimeAgg, todayAgg, last7dAgg, newCustomers7d, statusGroups, trendOrders] = await Promise.all([
    db.order.aggregate({ where: EARNED_WHERE, _count: { _all: true }, _sum: { totalCents: true } }),
    db.order.aggregate({
      where: { ...EARNED_WHERE, createdAt: { gte: todayStart } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    db.order.aggregate({
      where: { ...EARNED_WHERE, createdAt: { gte: since7d } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    db.user.count({ where: { createdAt: { gte: since7d } } }),
    db.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since30d } },
      _count: { _all: true },
    }),
    // Для графика по дням проще выбрать сырые заказы и разбить по дням в
    // JS (Prisma не умеет group-by-day без сырого SQL), чем городить
    // $queryRaw ради 14 баров — объём заказов одного кафе для этого
    // небольшой.
    db.order.findMany({
      where: { ...EARNED_WHERE, createdAt: { gte: sinceTrend } },
      select: { createdAt: true, totalCents: true },
    }),
  ]);

  const last7dCount = last7dAgg._count._all;
  const last7dRevenue = last7dAgg._sum.totalCents ?? 0;

  const revenueByDay = new Map<string, number>();
  for (const order of trendOrders) {
    const key = cafeDayKey(order.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.totalCents);
  }
  const dailyRevenue: DailyRevenuePoint[] = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date(todayStart.getTime() - (TREND_DAYS - 1 - i) * DAY_MS);
    const key = cafeDayKey(date);
    return {
      dateKey: key,
      label: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "Europe/Moscow" }),
      revenueCents: revenueByDay.get(key) ?? 0,
    };
  });

  return {
    allTime: {
      count: allTimeAgg._count._all,
      revenueCents: allTimeAgg._sum.totalCents ?? 0,
    },
    today: {
      count: todayAgg._count._all,
      revenueCents: todayAgg._sum.totalCents ?? 0,
    },
    last7d: {
      count: last7dCount,
      revenueCents: last7dRevenue,
      avgCents: last7dCount > 0 ? Math.round(last7dRevenue / last7dCount) : 0,
      newCustomers: newCustomers7d,
    },
    statusBreakdown30d: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    dailyRevenue,
  };
}
