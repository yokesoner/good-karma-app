import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/orderLabels";
import type { OrderStatusCount } from "@/server/adminDashboard";

// Ручная SVG-диаграмма вместо библиотеки графиков (в проекте её нет) —
// тот же дух, что у ручных SVG-иконок в LevelIcon.tsx/WokBuilder.tsx.
// Приём "несколько окружностей со stroke-dasharray" — стандартный способ
// нарисовать кольцевую диаграмму без стороннего кода.
const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "#D9A441",
  PREPARING: "#E08F5B",
  READY_FOR_PICKUP: "#5FA98A",
  HANDED_TO_COURIER: "#7FA6C9",
  DELIVERING: "#8D6FA8",
  DONE: "#3F8F6C",
  CANCELLED: "#C0392B",
};

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 70;
const STROKE = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OrderStatusDonutChart({ data }: { data: OrderStatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-center text-sm text-ink-2">
        За последние 30 дней заказов ещё не было.
      </div>
    );
  }

  const sorted = [...data].filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  let cumulative = 0;
  const arcs = sorted.map((d) => {
    const fraction = d.count / total;
    const length = fraction * CIRCUMFERENCE;
    const dashoffset = -cumulative;
    cumulative += length;
    return { ...d, length, dashoffset };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="shrink-0" role="img" aria-label="Заказы по статусам за последние 30 дней">
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--hair-soft, #ECE4DE)" strokeWidth={STROKE} />
          {arcs.map((arc) => (
            <circle
              key={arc.status}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={STATUS_COLORS[arc.status]}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={arc.dashoffset}
            />
          ))}
        </g>
        <text x={CENTER} y={CENTER - 6} textAnchor="middle" className="fill-ink text-[26px] font-bold">
          {total}
        </text>
        <text x={CENTER} y={CENTER + 16} textAnchor="middle" className="fill-ink-3 text-[10px] uppercase tracking-[0.1em]">
          заказов
        </text>
      </svg>

      <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
        {arcs.map((arc) => (
          <li key={arc.status} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[arc.status] }} />
              <span className="truncate text-ink-2">{ORDER_STATUS_LABELS[arc.status]}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {arc.count} · {Math.round((arc.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
