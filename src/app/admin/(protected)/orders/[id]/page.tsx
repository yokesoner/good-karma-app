import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { AdminOrderStatusForm } from "@/components/admin/AdminOrderStatusForm";
import { ArrowLeft, ArrowUpRight, Phone } from "@/components/icons";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatCafeDateTime } from "@/lib/cafeTime";
import { statusTone } from "@/lib/orderFlow";
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orderLabels";
import { toDialable } from "@/lib/phone";
import { buildCourierBrief, getYandexDeliveryUrl } from "@/lib/yandexDelivery";

export const metadata: Metadata = { title: "Заказ — админка Гуд Карма" };

// Только названия — *Id-поля (baseId/proteinId/sauceId) в customConfig
// нужны для перезаказа и цены, но администратору бесполезны на глаз.
const customLabels: Record<string, string> = {
  baseName: "Основа",
  proteinName: "Начинка",
  sauceName: "Соус",
};

function CustomConfig({ value }: { value: Prisma.JsonValue }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value).filter(
    ([key, entry]) => key in customLabels && (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean"),
  );
  if (!entries.length) return null;
  return <dl className="mt-3 grid gap-1 rounded-2xl bg-paper-3 px-4 py-3 text-xs text-ink-2 sm:grid-cols-2">{entries.map(([key, entry]) => <div key={key} className="flex gap-2"><dt className="text-ink-3">{customLabels[key]}:</dt><dd>{String(entry)}</dd></div>)}</dl>;
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return <div className="flex justify-between gap-5 border-b border-hair-soft pb-3"><dt className="shrink-0 text-ink-3">{label}</dt><dd className="min-w-0 text-right">{children ?? value}</dd></div>;
}

const panel = "rounded-[24px] border border-hair bg-paper-2 p-4 md:p-7";

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { user: true, items: { include: { addons: { include: { addon: true } } } } },
  });
  if (!order) notFound();
  const address = order.fulfillment === "PICKUP" ? "Самовывоз из кафе" : [order.address, order.addressFlat && `кв. ${order.addressFlat}`].filter(Boolean).join(", ");
  const isOpen = order.status !== "DONE" && order.status !== "CANCELLED";

  return (
    <div className="mx-auto max-w-3xl xl:max-w-none">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Заказы
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${statusTone(order.status)}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <h1 className="mt-2.5 text-[28px] font-semibold tracking-tight md:text-4xl">Заказ {order.number}</h1>
          <p className="mt-1 text-[13px] text-ink-2">{formatCafeDateTime(order.createdAt)} · {FULFILLMENT_LABELS[order.fulfillment]}</p>
        </div>
        <p className="shrink-0 text-[24px] font-semibold tabular-nums md:text-3xl">{formatMoney(order.totalCents)}</p>
      </div>

      {isOpen && (
        <div className="mt-5">
          <AdminOrderActions
            layout="detail"
            orderId={order.id}
            status={order.status}
            fulfillment={order.fulfillment}
            yandexUrl={getYandexDeliveryUrl()}
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
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] xl:gap-6">
        <div className="space-y-4 xl:space-y-6">
          <section className={panel}><h2 className="text-lg font-semibold">Состав заказа</h2><div className="mt-3 divide-y divide-hair-soft">{order.items.map((item) => <article key={item.id} className="py-3.5"><div className="flex items-start justify-between gap-5"><div><h3 className="font-semibold">{item.nameSnapshot}</h3><p className="mt-1 text-xs text-ink-3">{formatMoney(item.unitPriceCents)} × {item.qty}</p></div><p className="shrink-0 font-semibold tabular-nums">{formatMoney(item.unitPriceCents * item.qty)}</p></div>{item.addons.length > 0 && <ul className="mt-3 space-y-1 text-xs text-ink-2">{item.addons.map((entry) => <li key={entry.addonId}>Добавка: {entry.addon.name} (+{formatMoney(entry.priceCentsSnapshot)})</li>)}</ul>}{item.customConfig && <CustomConfig value={item.customConfig} />}</article>)}</div></section>
          {order.comment && <section className={panel}><h2 className="text-lg font-semibold">Комментарий</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{order.comment}</p></section>}
          <section className={panel}><h2 className="text-lg font-semibold">Суммы</h2><dl className="mt-4 space-y-3 text-sm"><InfoRow label="Подытог" value={formatMoney(order.subtotalCents)} />{order.discountCents > 0 && <InfoRow label={`Скидка${order.promoCode ? ` · ${order.promoCode}` : ""}`} value={`−${formatMoney(order.discountCents)}`} />}<InfoRow label="Доставка" value={order.deliveryCents ? formatMoney(order.deliveryCents) : "Бесплатно"} /><InfoRow label="Итого" value={formatMoney(order.totalCents)} /><InfoRow label="Начисленная карма" value={`+${order.karmaEarned}`} /></dl></section>
        </div>

        <div className="space-y-4 xl:space-y-6">
          <section className={panel}>
            <h2 className="text-lg font-semibold">Клиент и получение</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow label="Имя" value={order.user.name || "Не указано"} />
              <InfoRow label="Телефон">
                <a href={`tel:${toDialable(order.user.phone)}`} className="inline-flex items-center gap-1.5 font-semibold text-plum">
                  <Phone className="h-4 w-4" /> {toDialable(order.user.phone)}
                </a>
              </InfoRow>
              <InfoRow label="Получение" value={FULFILLMENT_LABELS[order.fulfillment]} />
              <InfoRow label={order.fulfillment === "PICKUP" ? "Место" : "Адрес"}>
                {address || "Не указан"}
                {order.fulfillment === "DELIVERY" && order.address && (
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(`${order.address}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold text-plum"
                  >
                    Открыть на карте <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </InfoRow>
              {order.deliveryZone && <InfoRow label="Зона доставки" value={`№${order.deliveryZone}`} />}
              {order.distanceKm && <InfoRow label="Расстояние" value={`${Number(order.distanceKm).toFixed(1)} км`} />}
              {order.slotLabel && <InfoRow label="Время" value={order.slotLabel} />}
            </dl>
          </section>
          <section className={panel}><h2 className="text-lg font-semibold">Оплата и время</h2><dl className="mt-4 space-y-3 text-sm"><InfoRow label="Способ оплаты" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} /><InfoRow label="Статус оплаты" value={PAYMENT_STATUS_LABELS[order.paymentStatus]} /><InfoRow label="Создан" value={formatCafeDateTime(order.createdAt)} /><InfoRow label="Обновлён" value={formatCafeDateTime(order.updatedAt)} /></dl></section>

          {/* Полная форма статусов остаётся — для нестандартных случаев
              (отмена, возврат, правка оплаты), но не мешает основным
              кнопкам выше. */}
          <details className="group rounded-[24px] border border-hair bg-paper-2">
            <summary className="cursor-pointer list-none rounded-[24px] px-5 py-4 text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              Изменить статус вручную
              <span className="ml-2 text-xs font-normal text-ink-3">отмена, оплата, любой статус</span>
            </summary>
            <div className="px-2 pb-2">
              <AdminOrderStatusForm id={order.id} initial={{ status: order.status, paymentStatus: order.paymentStatus, fulfillment: order.fulfillment }} />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
