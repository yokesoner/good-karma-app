import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderStatusForm } from "@/components/admin/AdminOrderStatusForm";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orderLabels";

export const metadata: Metadata = { title: "Заказ — админка Гуд Карма" };

const customLabels: Record<string, string> = {
  baseId: "ID основы",
  baseName: "Основа",
  proteinId: "ID белка",
  proteinName: "Белок",
  sauceId: "ID соуса",
  sauceName: "Соус",
};

function CustomConfig({ value }: { value: Prisma.JsonValue }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value).filter(([, entry]) => typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean");
  if (!entries.length) return null;
  return <dl className="mt-3 grid gap-1 rounded-2xl bg-paper-3 px-4 py-3 text-xs text-ink-2 sm:grid-cols-2">{entries.map(([key, entry]) => <div key={key} className="flex gap-2"><dt className="text-ink-3">{customLabels[key] ?? key}:</dt><dd>{String(entry)}</dd></div>)}</dl>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 border-b border-hair-soft pb-3"><dt className="text-ink-3">{label}</dt><dd className="text-right">{value}</dd></div>;
}

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { user: true, items: { include: { addons: { include: { addon: true } } } } },
  });
  if (!order) notFound();
  const address = order.fulfillment === "PICKUP" ? "Самовывоз из кафе" : [order.address, order.addressFlat && `кв. ${order.addressFlat}`].filter(Boolean).join(", ");

  return (
    <div>
      <Link href="/admin/orders" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все заказы</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cherry">{ORDER_STATUS_LABELS[order.status]}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Заказ {order.number}</h1><p className="mt-2 text-sm text-ink-2">{order.createdAt.toLocaleString("ru-RU", { dateStyle: "long", timeStyle: "short" })}</p></div><p className="text-3xl font-semibold">{formatMoney(order.totalCents)}</p></div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7"><h2 className="text-xl font-semibold">Состав заказа</h2><div className="mt-4 divide-y divide-hair-soft">{order.items.map((item) => <article key={item.id} className="py-4"><div className="flex items-start justify-between gap-5"><div><h3 className="font-semibold">{item.nameSnapshot}</h3><p className="mt-1 text-xs text-ink-3">{formatMoney(item.unitPriceCents)} × {item.qty}</p></div><p className="shrink-0 font-semibold">{formatMoney(item.unitPriceCents * item.qty)}</p></div>{item.addons.length > 0 && <ul className="mt-3 space-y-1 text-xs text-ink-2">{item.addons.map((entry) => <li key={entry.addonId}>Добавка: {entry.addon.name} (+{formatMoney(entry.priceCentsSnapshot)})</li>)}</ul>}{item.customConfig && <CustomConfig value={item.customConfig} />}</article>)}</div></section>
          {order.comment && <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7"><h2 className="text-xl font-semibold">Комментарий</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{order.comment}</p></section>}
          <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7"><h2 className="text-xl font-semibold">Суммы</h2><dl className="mt-5 space-y-3 text-sm"><InfoRow label="Подытог" value={formatMoney(order.subtotalCents)} />{order.discountCents > 0 && <InfoRow label={`Скидка${order.promoCode ? ` · ${order.promoCode}` : ""}`} value={`−${formatMoney(order.discountCents)}`} />}<InfoRow label="Доставка" value={order.deliveryCents ? formatMoney(order.deliveryCents) : "Бесплатно"} /><InfoRow label="Итого" value={formatMoney(order.totalCents)} /><InfoRow label="Начисленная карма" value={`+${order.karmaEarned}`} /></dl></section>
        </div>

        <div className="space-y-6">
          <AdminOrderStatusForm id={order.id} initial={{ status: order.status, paymentStatus: order.paymentStatus }} />
          <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7"><h2 className="text-xl font-semibold">Клиент и получение</h2><dl className="mt-5 space-y-3 text-sm"><InfoRow label="Имя" value={order.user.name || "Не указано"} /><InfoRow label="Телефон" value={order.user.phone} /><InfoRow label="Получение" value={FULFILLMENT_LABELS[order.fulfillment]} /><InfoRow label={order.fulfillment === "PICKUP" ? "Место" : "Адрес"} value={address || "Не указан"} />{order.deliveryZone && <InfoRow label="Зона доставки" value={`№${order.deliveryZone}`} />}{order.distanceKm && <InfoRow label="Расстояние" value={`${Number(order.distanceKm).toFixed(1)} км`} />}{order.slotLabel && <InfoRow label="Время" value={order.slotLabel} />}</dl></section>
          <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7"><h2 className="text-xl font-semibold">Оплата и время</h2><dl className="mt-5 space-y-3 text-sm"><InfoRow label="Способ оплаты" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} /><InfoRow label="Статус оплаты" value={PAYMENT_STATUS_LABELS[order.paymentStatus]} /><InfoRow label="Создан" value={order.createdAt.toLocaleString("ru-RU")} /><InfoRow label="Обновлён" value={order.updatedAt.toLocaleString("ru-RU")} /></dl></section>
        </div>
      </div>
    </div>
  );
}
