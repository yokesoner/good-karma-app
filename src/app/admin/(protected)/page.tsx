import type { Metadata } from "next";
import { OrderStatusDonutChart } from "@/components/admin/OrderStatusDonutChart";
import { RevenueTrendChart } from "@/components/admin/RevenueTrendChart";
import { formatMoney } from "@/lib/money";
import { getAdminDashboardStats } from "@/server/adminDashboard";

export const metadata: Metadata = { title: "Главная — админка Гуд Карма" };

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-5 w-5",
};

const ICONS = {
  coin: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 15c.4.9 1.3 1.4 2.5 1.4 1.7 0 2.8-.8 2.8-2s-1-1.7-2.8-2c-1.8-.3-2.8-.8-2.8-2s1.1-2 2.8-2c1.2 0 2.1.5 2.5 1.4" />
      <path d="M12 7.3v1.1M12 15.6v1.1" />
    </svg>
  ),
  bag: (
    <svg {...iconProps}>
      <path d="M6 8h12l1 12.5H5L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  ),
  chart: (
    <svg {...iconProps}>
      <path d="M4 20V10M11 20V4M18 20v-6" />
    </svg>
  ),
  receipt: (
    <svg {...iconProps}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-1.5-1.5L10 21l-2.5-1.5L6 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  people: (
    <svg {...iconProps}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.6-3 2.7-4.7 5.5-4.7s4.9 1.7 5.5 4.7" />
      <path d="M15.5 8a2.7 2.7 0 1 1 0 5.4" />
      <path d="M16 14.3c2.3.3 3.9 1.9 4.4 4.4" />
    </svg>
  ),
};

function StatCard({ icon, label, value, hint }: { icon: keyof typeof ICONS; label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-[25px] border border-hair bg-paper-2 p-5 shadow-s">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-tint-cream text-cherry">{ICONS[icon]}</span>
      <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">{label}</span>
      <b className="mt-1 block text-[26px] leading-none tracking-[-0.03em]">{value}</b>
      {hint && <span className="mt-2 block text-xs text-ink-3">{hint}</span>}
    </article>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Обзор</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-4xl">Главная</h1>
      </div>

      <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-tint-gold via-paper-2 to-tint-mint p-6 shadow-m sm:p-8">
        <span aria-hidden className="absolute -right-6 -top-10 text-[150px] font-bold leading-none text-plum/5">福</span>
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-[18px] bg-white/60 text-cherry shadow-s">
            <span className="[&_svg]:h-7 [&_svg]:w-7">{ICONS.coin}</span>
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">Заработано всего</span>
            <b className="mt-1 block text-[40px] font-bold leading-none tracking-[-0.03em] sm:text-[48px]">{formatMoney(stats.allTime.revenueCents)}</b>
            <span className="mt-2 block text-[12.5px] text-ink-2">{stats.allTime.count} заказов за всё время (без отменённых)</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="bag" label="Заказов сегодня" value={String(stats.today.count)} hint={formatMoney(stats.today.revenueCents)} />
        <StatCard icon="chart" label="Заказов за 7 дней" value={String(stats.last7d.count)} hint={formatMoney(stats.last7d.revenueCents)} />
        <StatCard icon="receipt" label="Средний чек · 7 дней" value={formatMoney(stats.last7d.avgCents)} />
        <StatCard icon="people" label="Новых клиентов · 7 дней" value={String(stats.last7d.newCustomers)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7">
          <h2 className="text-xl font-semibold">Выручка по дням</h2>
          <p className="mt-1 text-sm text-ink-2">Последние 14 дней, без отменённых заказов</p>
          <div className="mt-6">
            <RevenueTrendChart data={stats.dailyRevenue} />
          </div>
        </section>

        <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7">
          <h2 className="text-xl font-semibold">Заказы по статусам</h2>
          <p className="mt-1 text-sm text-ink-2">За последние 30 дней</p>
          <div className="mt-6">
            <OrderStatusDonutChart data={stats.statusBreakdown30d} />
          </div>
        </section>
      </div>
    </div>
  );
}
