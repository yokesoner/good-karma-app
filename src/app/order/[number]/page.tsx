import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Заказ — Гуд Карма",
  robots: { index: false },
};

// Телефон и внешняя страница отслеживания вынесены в константы, как в
// прототипе: если появится агрегатор или своя страница трекинга, меняется
// одна строка. Пустой URL — значит используем телефон.
const DELIVERY_PHONE = "+7 (999) 000-00-00";
const DELIVERY_TRACKING_URL = "";

const STAGES = [
  { key: "NEW", label: "Заказ принят" },
  { key: "PREPARING", label: "Готовится" },
  { key: "HANDED_TO_COURIER", label: "Передан в доставку" },
  { key: "DELIVERING", label: "Доставляется" },
] as const;

export default async function OrderPage({ params }: { params: { number: string } }) {
  const order = await db.order.findUnique({
    where: { number: params.number },
    include: {
      items: { include: { addons: { include: { addon: true } } } },
    },
  });

  if (!order) notFound();

  const currentIndex = STAGES.findIndex((s) => s.key === order.status);
  const isDone = order.status === "DONE";

  return (
    <main className="mx-auto max-w-wrap px-5 py-10 md:px-16">
      <div className="rounded-l border border-hair bg-paper-2 p-6 md:p-10">
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

      {/* Этапы без обратного отсчёта — сознательное решение из прототипа:
          обещать точное время до минуты значит регулярно его нарушать. */}
      <div className="mt-8 grid grid-cols-2 gap-y-6 md:grid-cols-4">
        {STAGES.map((stage, i) => {
          const done = isDone || i < currentIndex;
          const now = !isDone && i === currentIndex;
          return (
            <div key={stage.key} className="relative pr-4 pt-6">
              <span
                className={`absolute left-0 right-4 top-0 h-[3px] rounded-full ${
                  done || now ? "bg-cherry" : "bg-hair"
                }`}
              />
              <span className="text-[10px] font-bold tracking-[0.16em] text-ink-3">
                0{i + 1}
              </span>
              <b className={`mt-1.5 block text-[14.5px] font-bold ${now ? "text-cherry" : ""}`}>
                {stage.label}
              </b>
            </div>
          );
        })}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
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
                ["Оформлен", order.createdAt.toLocaleString("ru-RU")],
                ["Способ", order.fulfillment === "PICKUP" ? "самовывоз" : "доставка"],
                [
                  order.fulfillment === "PICKUP" ? "Адрес кафе" : "Адрес",
                  order.fulfillment === "PICKUP"
                    ? "ул. Садовая, 12"
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
