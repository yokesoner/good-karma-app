import { formatMoney } from "@/lib/money";
import type { DailyRevenuePoint } from "@/server/adminDashboard";

// Ручной SVG-бар-чарт — тем же приёмом, что и OrderStatusDonutChart:
// в проекте нет библиотеки графиков, заводить её ради одной страницы
// не стал.
const WIDTH = 640;
const HEIGHT = 180;
const BAR_GAP = 6;

export function RevenueTrendChart({ data }: { data: DailyRevenuePoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenueCents));
  const barWidth = (WIDTH - BAR_GAP * (data.length - 1)) / data.length;
  const bestIndex = data.reduce((best, d, i) => (d.revenueCents > data[best]!.revenueCents ? i : best), 0);

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 24}`} width="100%" height={HEIGHT + 24} role="img" aria-label="Выручка по дням за последние 14 дней" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
            {/* --cherry/--plum-deep хранят "R G B" триплет для rgb(var(...) / a)
                (см. withAlpha в tailwind.config.ts), не готовый цвет сам по
                себе — здесь оборачиваю явно, иначе градиент не отрисуется. */}
            <stop offset="0%" stopColor="rgb(var(--cherry, 140 77 104))" stopOpacity="0.95" />
            <stop offset="100%" stopColor="rgb(var(--plum-deep, 58 35 56))" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const x = i * (barWidth + BAR_GAP);
          const barHeight = Math.max(2, (d.revenueCents / max) * HEIGHT);
          const y = HEIGHT - barHeight;
          const isBest = i === bestIndex && d.revenueCents > 0;
          return (
            <g key={d.dateKey}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={Math.min(6, barWidth / 3)}
                fill={isBest ? "url(#revenueBarGradient)" : "var(--hair-soft, #ECE4DE)"}
              />
              <text x={x + barWidth / 2} y={HEIGHT + 16} textAnchor="middle" className="fill-ink-3 text-micro">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-xs text-ink-3">
        Лучший день — {formatMoney(data[bestIndex]?.revenueCents ?? 0)} ({data[bestIndex]?.label})
      </p>
    </div>
  );
}
