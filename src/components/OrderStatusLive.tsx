"use client";

import { useEffect, useRef, useState } from "react";
import { ALLOWED_STATUSES_BY_FULFILLMENT, ORDER_STATUS_LABELS } from "@/lib/orderLabels";
import { getOrderStatus } from "@/server/orderTracking";

const POLL_MS = 8000;

type Status = keyof typeof ORDER_STATUS_LABELS;
type Fulfillment = "PICKUP" | "DELIVERY";

// Поллинг вместо SSE/WebSocket — тот же приём, что и у AdminOrderAlerts
// (проект намеренно без лишней инфраструктуры сверх одного PM2-процесса).
// Честная оговорка: работает только пока вкладка открыта, это не настоящий
// пуш — для этого понадобился бы отдельный сервис-воркер.
export function OrderStatusLive({
  number,
  fulfillment,
  initialStatus,
}: {
  number: string;
  fulfillment: Fulfillment;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (fulfillment !== "PICKUP") return;
    let cancelled = false;

    async function poll() {
      const result = await getOrderStatus(number).catch(() => null);
      if (cancelled || !result) return;
      setStatus((prev) => (prev === result.status ? prev : result.status));
    }

    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [number, fulfillment]);

  useEffect(() => {
    if (status !== "READY_FOR_PICKUP" || notifiedRef.current) return;
    notifiedRef.current = true;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Заказ готов", { body: `${number} можно забирать` , tag: number });
    }
  }, [status, number]);

  // Этапы без обратного отсчёта, DONE/CANCELLED сюда не входят — как и в
  // исходной вёрстке, "выполнено" читается по заполненным барам, без
  // отдельного финального шага.
  const stages = ALLOWED_STATUSES_BY_FULFILLMENT[fulfillment].filter(
    (s): s is Exclude<Status, "CANCELLED" | "DONE"> => s !== "CANCELLED" && s !== "DONE",
  );
  const currentIndex = stages.indexOf(status as (typeof stages)[number]);
  const isDone = status === "DONE";
  const isReady = fulfillment === "PICKUP" && status === "READY_FOR_PICKUP";
  const gridColsClass = stages.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4";

  return (
    <>
      {isReady && (
        <div
          role="status"
          className="mb-6 rounded-s bg-tint-mint px-5 py-4 text-[14px] font-semibold text-ink"
        >
          🎉 Заказ готов — можно забирать в кафе.
        </div>
      )}
      <div className={`grid grid-cols-2 gap-y-6 ${gridColsClass}`}>
        {stages.map((key, i) => {
          const done = isDone || i < currentIndex;
          const now = !isDone && i === currentIndex;
          return (
            <div key={key} className="relative pr-4 pt-6">
              <span
                className={`absolute left-0 right-4 top-0 h-[3px] rounded-full ${
                  done || now ? "bg-cherry" : "bg-hair"
                }`}
              />
              <span className="text-[10px] font-bold tracking-[0.16em] text-ink-3">
                0{i + 1}
              </span>
              <b className={`mt-1.5 block text-[14.5px] font-bold ${now ? "text-cherry" : ""}`}>
                {ORDER_STATUS_LABELS[key]}
              </b>
            </div>
          );
        })}
      </div>
    </>
  );
}
