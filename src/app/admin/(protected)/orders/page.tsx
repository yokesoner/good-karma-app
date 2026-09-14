import type { OrderStatus, Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orderLabels";

export const metadata: Metadata = { title: "Заказы — админка Гуд Карма" };

const PAGE_SIZE = 20;
const filters = [
  { key: "active", label: "Активные" },
  { key: "done", label: "Завершённые" },
  { key: "cancelled", label: "Отменённые" },
  { key: "all", label: "Все" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function orderWhere(filter: FilterKey): Prisma.OrderWhereInput {
  if (filter === "done") return { status: "DONE" };
  if (filter === "cancelled") return { status: "CANCELLED" };
  if (filter === "active") return { status: { notIn: ["DONE", "CANCELLED"] } };
  return {};
}

function statusClass(status: OrderStatus) {
  if (status === "CANCELLED") return "bg-tint-blush text-cherry";
  if (status === "DONE") return "bg-tint-mint";
  return "bg-tint-gold";
}

export default async function AdminOrdersPage({ searchParams }: { searchParams?: { status?: string; page?: string } }) {
  const filter = filters.some((item) => item.key === searchParams?.status) ? searchParams!.status as FilterKey : "active";
  const requestedPage = Number(searchParams?.page ?? "1");
  const candidatePage = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1_000_000) : 1;
  const where = orderWhere(filter);
  const total = await db.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(candidatePage, totalPages);
  const orders = await db.order.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: filter === "active" ? "asc" : "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });
  const pageHref = (target: number) => `/admin/orders?status=${filter}&page=${target}`;

  return (
    <div>
      <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Операционная работа</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Заказы</h1><p className="mt-2 text-sm text-ink-2">{total} заказов в выборке</p></div>
      <nav aria-label="Фильтр заказов" className="mt-7 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => <Link key={item.key} href={item.key === "active" ? "/admin/orders" : `/admin/orders?status=${item.key}`} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] ${filter === item.key ? "bg-plum-deep text-btn-fg" : "border border-hair bg-paper-2 text-ink-2"}`}>{item.label}</Link>)}
      </nav>
      <div className="mt-5 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
        <div className="hidden grid-cols-[140px_1fr_190px_130px_170px_150px] gap-4 border-b border-hair px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 xl:grid"><span>Заказ</span><span>Клиент</span><span>Статус</span><span>Получение</span><span>Оплата</span><span className="text-right">Создан</span></div>
        {orders.map((order) => (
          <Link key={order.id} href={`/admin/orders/${order.id}`} className="grid gap-3 border-b border-hair p-5 transition last:border-b-0 hover:bg-paper-3 xl:grid-cols-[140px_1fr_190px_130px_170px_150px] xl:items-center">
            <div><h2 className="font-semibold text-plum">{order.number}</h2><p className="mt-1 text-sm font-semibold">{formatMoney(order.totalCents)}</p></div>
            <div><p className="text-sm font-medium">{order.user.name || "Имя не указано"}</p><p className="mt-1 text-xs text-ink-3">{order.user.phone}</p></div>
            <div><span className={`inline-flex rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] ${statusClass(order.status)}`}>{ORDER_STATUS_LABELS[order.status]}</span></div>
            <p className="text-sm text-ink-2">{FULFILLMENT_LABELS[order.fulfillment]}</p>
            <div><p className="text-sm text-ink-2">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p><p className="mt-1 text-xs text-ink-3">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p></div>
            <time dateTime={order.createdAt.toISOString()} className="text-sm text-ink-2 xl:text-right">{order.createdAt.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}</time>
          </Link>
        ))}
        {orders.length === 0 && <p className="p-10 text-center text-sm text-ink-2">В этой выборке заказов нет.</p>}
      </div>
      {totalPages > 1 && <nav aria-label="Страницы заказов" className="mt-6 flex items-center justify-center gap-4"><Link aria-disabled={page <= 1} href={page > 1 ? pageHref(page - 1) : pageHref(1)} className={`rounded-full border border-hair px-5 py-2 text-xs font-bold ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}>← Назад</Link><span className="text-sm text-ink-2">{page} из {totalPages}</span><Link aria-disabled={page >= totalPages} href={page < totalPages ? pageHref(page + 1) : pageHref(totalPages)} className={`rounded-full border border-hair px-5 py-2 text-xs font-bold ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}>Дальше →</Link></nav>}
    </div>
  );
}
