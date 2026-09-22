import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { OrderAccessGate } from "@/components/OrderAccessGate";
import { OrderStatusLive } from "@/components/OrderStatusLive";
import { CAFE_ADDRESS } from "@/lib/delivery";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatCafeDateTime } from "@/lib/cafeTime";
import { hasOrderAccess } from "@/lib/orderAccess";

export const metadata: Metadata = {
  title: "Заказ",
  robots: { index: false },
};

// Телефон и внешняя страница отслеживания вынесены в константы, как в
// прототипе: если появится агрегатор или своя страница трекинга, меняется
// одна строка. Пустой URL — значит используем телефон.
const DELIVERY_PHONE = "+7 (999) 000-00-00";
const DELIVERY_TRACKING_URL = "";

export default async function OrderPage({ params }: { params: { number: string } }) {
  const order = await db.order.findUnique({
    where: { number: params.number },
    include: {
      items: { include: { addons: { include: { addon: true } } } },
    },
  });

  if (!order) notFound();

  // Номера заказов последовательные (GK-00001, ...) — без этой проверки
  // страница была бы читаема перебором URL кем угодно.
  const granted = await hasOrderAccess(order.number);
  if (!granted) {
    return (
      <main className="mx-auto max-w-wrap px-5 py-10 md:px-16">
        <OrderAccessGate number={order.number} />
      </main>
    );
  }

  const onlinePaymentPending = order.paymentMethod === "CARD_ONLINE" && order.paymentStatus === "PENDING";

  return (
    <main className="mx-auto max-w-wrap px-5 py-5 md:px-16 md:py-10">
      <div className="rounded-[26px] border border-hair bg-paper-2 p-5 md:rounded-l md:p-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
          Спасибо за заказ
        </span>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight md:text-[32px]">
          Заказ {order.number}
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">
          {order.items.reduce((n, i) => n + i.qty, 0)} позиции ·{" "}
          {formatMoney(order.totalCents)} ·{" "}
          {order.fulfillment === "PICKUP" ? "самовывоз" : "доставка"}
        </p>
        <p className="mt-3 text-[12.5px] text-ink-3">
          Закроете страницу — не страшно: этот заказ сохранён в разделе{" "}
          <Link href="/track" className="font-semibold text-cherry hover:underline">
            «Заказ»
          </Link>{" "}
          в этом браузере.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <a
            href={DELIVERY_TRACKING_URL || `tel:${DELIVERY_PHONE.replace(/[^+\d]/g, "")}`}
            {...(DELIVERY_TRACKING_URL ? { target: "_blank", rel: "noopener" } : {})}
            className="rounded-s bg-btn px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-btn-fg transition hover:opacity-90"
          >
            Узнать о заказе
          </a>
          <span className="text-[12.5px] text-ink-3">
            {DELIVERY_TRACKING_URL ? "Откроется страница заказа" : DELIVERY_PHONE}
          </span>
        </div>
      </div>

      {onlinePaymentPending && (
        <div
          role="status"
          className="mt-8 rounded-s bg-tint-cream px-5 py-4 text-[13.5px] leading-relaxed text-ink-2"
        >
          <b className="font-bold text-ink">Онлайн-оплата подключается.</b> В ближайшее время
          администратор свяжется, чтобы принять оплату — это ещё не автоматический платёж.
        </div>
      )}

      {/* Этапы без обратного отсчёта — сознательное решение из прототипа:
          обещать точное время до минуты значит регулярно его нарушать. */}
      <div className="mt-8">
        <OrderStatusLive number={order.number} fulfillment={order.fulfillment} initialStatus={order.status} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:mt-10 md:grid-cols-2 md:gap-10">
        <div>
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
            Состав заказа
          </span>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-baseline gap-3 border-b border-hair-soft py-3 text-[14px]"
            >
              <span className="min-w-0 flex-1">
                {item.nameSnapshot}
                {item.addons.length > 0 && (
                  <span className="block text-[11.5px] text-ink-3">
                    {item.addons.map((a) => a.addon.name).join(" · ")}
                  </span>
                )}
              </span>
              <span className="text-[12px] text-ink-3">× {item.qty}</span>
              <span className="tabular-nums">
                {formatMoney(item.unitPriceCents * item.qty)}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-4 text-[15px] font-bold">
            <span>Итого</span>
            <span className="tabular-nums">{formatMoney(order.totalCents)}</span>
          </div>
        </div>

        <div>
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
            Информация
          </span>
          <dl className="flex flex-col gap-3 text-[14px]">
            {(
              [
                ["Номер", order.number],
                ["Оформлен", formatCafeDateTime(order.createdAt)],
                ["Способ", order.fulfillment === "PICKUP" ? "самовывоз" : "доставка"],
                [
                  order.fulfillment === "PICKUP" ? "Адрес кафе" : "Адрес",
                  order.fulfillment === "PICKUP"
                    ? CAFE_ADDRESS
                    : [order.address, order.addressFlat].filter(Boolean).join(", "),
                ],
                ...(order.deliveryZone ? [["Зона доставки", `№${order.deliveryZone}`]] : []),
                ["Карма-баллы", `+${order.karmaEarned}`],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-hair-soft pb-3">
                <dt className="text-ink-3">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Link href="/" className="mt-10 inline-block text-[13px] text-cherry hover:underline">
        ← На главную
      </Link>
    </main>
  );
}
