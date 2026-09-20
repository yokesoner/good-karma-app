import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/orderLabels";
import type { getMyRecentOrders } from "@/server/orderTracking";

type Orders = Awaited<ReturnType<typeof getMyRecentOrders>>;

export function RecentOrdersList({ orders }: { orders: Orders }) {
  return (
    <div className="mx-auto max-w-[440px] overflow-hidden rounded-l border border-hair bg-paper-2">
      {orders.map((order) => (
        <Link
          key={order.number}
          href={`/order/${order.number}`}
          className="flex items-center justify-between gap-4 border-b border-hair-soft px-6 py-4 transition last:border-b-0 hover:bg-paper-3"
        >
          <div>
            <p className="font-semibold text-plum">{order.number}</p>
            <p className="mt-1 text-xs text-ink-3">
              {order.createdAt.toLocaleDateString("ru-RU")} · {order.itemsCount} поз. ·{" "}
              {ORDER_STATUS_LABELS[order.status]}
            </p>
          </div>
          <p className="shrink-0 font-semibold">{formatMoney(order.totalCents)}</p>
        </Link>
      ))}
    </div>
  );
}
