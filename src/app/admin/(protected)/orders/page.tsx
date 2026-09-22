import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { AdminOrdersAutoRefresh } from "@/components/admin/AdminOrdersAutoRefresh";
import { Bag, Phone, Pin } from "@/components/icons";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatOrderTime } from "@/lib/cafeTime";
import { toDialable } from "@/lib/phone";
import { statusDot, statusTone } from "@/lib/orderFlow";
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orderLabels";
import { buildCourierBrief, getYandexDeliveryUrl } from "@/lib/yandexDelivery";
import { getAdminOrderCounts } from "@/server/adminOrderCounts";

export const metadata: Metadata = { title: "Заказы — админка Гуд Карма" };

const PAGE_SIZE = 20;
const filters = [
  { key: "active", label: "Активные" },
  { key: "done", label: "Выполнены" },
  { key: "cancelled", label: "Отменены" },
  { key: "all", label: "Все" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function orderWhere(filter: FilterKey): Prisma.OrderWhereInput {
  if (filter === "done") return { status: "DONE" };
  if (filter === "cancelled") return { status: "CANCELLED" };
  if (filter === "active") return { status: { notIn: ["DONE", "CANCELLED"] } };
  return {};
}

// Список заказов для работы с телефона: каждый заказ — карточка с самым
// важным (номер, время, сумма, что заказали, куда везти) и кнопками
// следующего шага прямо в списке, без захода в заказ и выпадающих селектов.
// Вкладки-фильтры помещаются в экран без горизонтальной прокрутки и
// показывают, сколько заказов в каждой.
export default async function AdminOrdersPage({ searchParams }: { searchParams?: { status?: string; page?: string } }) {
  const filter = filters.some((item) => item.key === searchParams?.status) ? (searchParams!.status as FilterKey) : "active";
  const requestedPage = Number(searchParams?.page ?? "1");
  const candidatePage = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1_000_000) : 1;
  const where = orderWhere(filter);
  const [counts, total] = await Promise.all([getAdminOrderCounts(), db.order.count({ where })]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(candidatePage, totalPages);
  const orders = await db.order.findMany({
    where,
    include: { user: true, items: { select: { nameSnapshot: true, qty: true } } },
    orderBy: { createdAt: filter === "active" ? "asc" : "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });
  const pageHref = (target: number) => `/admin/orders?status=${filter}&page=${target}`;
  const yandexUrl = getYandexDeliveryUrl();
  const now = new Date();
  const countByFilter: Record<FilterKey, number> = {
    active: counts.active,
    done: counts.done,
    cancelled: counts.cancelled,
    all: counts.all,
  };

  return (
    <div>
      <AdminOrdersAutoRefresh />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Операционная работа</p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight md:text-4xl">Заказы</h1>
      </div>

      {/* Сегментированный переключатель: четыре короткие вкладки на всю
          ширину, без горизонтальной прокрутки — активная всегда видна. */}
      <nav aria-label="Фильтр заказов" className="mt-4 grid grid-cols-4 gap-1 rounded-full border border-hair bg-paper-2 p-1 md:max-w-xl">
        {filters.map((item) => {
          const active = filter === item.key;
          const count = countByFilter[item.key];
          return (
            <Link
              key={item.key}
              href={item.key === "active" ? "/admin/orders" : `/admin/orders?status=${item.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center rounded-full px-1 py-2 text-center transition-colors duration-200 active:scale-95 ${
                active ? "bg-plum-deep text-btn-fg shadow-s" : "text-ink-2 hover:bg-paper-3"
              }`}
            >
              <span className="max-w-full truncate text-[12px] font-semibold leading-tight">{item.label}</span>
              <span className={`mt-0.5 text-[10px] font-bold leading-none ${active ? "opacity-80" : "text-ink-3"}`}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {orders.map((order) => {
          const address =
            order.fulfillment === "PICKUP"
              ? "Самовывоз из кафе"
              : [order.address, order.addressFlat && `кв. ${order.addressFlat}`].filter(Boolean).join(", ") || "Адрес не указан";
          const isOpen = order.status !== "DONE" && order.status !== "CANCELLED";
          const itemsSummary = order.items
            .slice(0, 2)
            .map((item) => `${item.nameSnapshot}${item.qty > 1 ? ` ×${item.qty}` : ""}`)
            .join(", ");
          const moreItems = order.items.length - 2;

          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-[22px] border border-hair bg-paper-2 transition-shadow duration-300 hover:shadow-s"
            >
              <Link href={`/admin/orders/${order.id}`} className="block p-4 transition-colors active:bg-paper-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${statusDot(order.status)}`} />
                      <h2 className="text-[16px] font-bold text-plum">{order.number}</h2>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-3">
                      <time dateTime={order.createdAt.toISOString()}>{formatOrderTime(order.createdAt, now)}</time> ·{" "}
                      {FULFILLMENT_LABELS[order.fulfillment]}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[16px] font-bold tabular-nums">{formatMoney(order.totalCents)}</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${statusTone(order.status)}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>

                <p className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-ink-2">
                  <Bag className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                  <span className="min-w-0">
                    {itemsSummary || "Пустой заказ"}
                    {moreItems > 0 && <span className="text-ink-3"> и ещё {moreItems}</span>}
                  </span>
                </p>
                <p className="mt-1.5 flex items-start gap-2 text-[13px] leading-snug text-ink-2">
                  <Pin className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                  <span className="min-w-0">{address}</span>
                </p>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] text-ink-3">
                  <span className="min-w-0 truncate">
                    {order.user.name || "Имя не указано"} · {toDialable(order.user.phone)}
                  </span>
                  <span>
                    {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus].toLowerCase()}
                  </span>
                </div>
              </Link>

              {isOpen && (
                <div className="flex items-start gap-2 border-t border-hair-soft p-3">
                  <div className="min-w-0 flex-1">
                    <AdminOrderActions
                      orderId={order.id}
                      status={order.status}
                      fulfillment={order.fulfillment}
                      yandexUrl={yandexUrl}
                      courierBrief={buildCourierBrief({
                        number: order.number,
                        customerName: order.user.name,
                        customerPhone: order.user.phone,
                        address: order.address,
                        addressFlat: order.addressFlat,
                        comment: order.comment,
                      })}
                    />
                  </div>
                  <a
                    href={`tel:${toDialable(order.user.phone)}`}
                    aria-label={`Позвонить клиенту ${order.user.name ?? ""}`.trim()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-hair bg-paper-2 text-plum transition active:scale-90"
                  >
                    <Phone className="h-[18px] w-[18px]" />
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {orders.length === 0 && (
        <p className="mt-4 rounded-[22px] border border-hair bg-paper-2 p-10 text-center text-sm text-ink-2">
          В этой выборке заказов нет.
        </p>
      )}
      {totalPages > 1 && (
        <nav aria-label="Страницы заказов" className="mt-6 flex items-center justify-center gap-4">
          <Link aria-disabled={page <= 1} href={page > 1 ? pageHref(page - 1) : pageHref(1)} className={`rounded-full border border-hair px-5 py-2 text-xs font-bold ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}>← Назад</Link>
          <span className="text-sm text-ink-2">{page} из {totalPages}</span>
          <Link aria-disabled={page >= totalPages} href={page < totalPages ? pageHref(page + 1) : pageHref(totalPages)} className={`rounded-full border border-hair px-5 py-2 text-xs font-bold ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}>Дальше →</Link>
        </nav>
      )}
    </div>
  );
}
