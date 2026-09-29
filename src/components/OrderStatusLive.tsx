"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Truck } from "@/components/icons";
import { Collapsible } from "@/components/Collapsible";
import { ALLOWED_STATUSES_BY_FULFILLMENT, ORDER_STATUS_LABELS } from "@/lib/orderLabels";
import { confirmOrderReceived, getOrderStatus } from "@/server/orderTracking";

const POLL_MS = 8000;

type Status = keyof typeof ORDER_STATUS_LABELS;
type Fulfillment = "PICKUP" | "DELIVERY";

const isFinal = (status: Status) => status === "DONE" || status === "CANCELLED";

// Поллинг вместо SSE/WebSocket — тот же приём, что и у AdminOrderAlerts
// (проект намеренно без лишней инфраструктуры сверх одного PM2-процесса).
// Честная оговорка: работает только пока вкладка открыта, это не настоящий
// пуш — для этого понадобился бы отдельный сервис-воркер.
//
// Опрашиваем и доставку, и самовывоз: как только админ передал заказ
// Яндекс Доставке (статус «Доставляется»), покупатель на этой же странице
// видит кнопку «Заказ получен» — без перезагрузки.
export function OrderStatusLive({
  number,
  fulfillment,
  initialStatus,
}: {
  number: string;
  fulfillment: Fulfillment;
  initialStatus: Status;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (isFinal(status)) return;
    let cancelled = false;

    async function poll() {
      // Свёрнутая вкладка не должна каждые 8 секунд дёргать сервер.
      if (document.visibilityState === "hidden") return;
      const result = await getOrderStatus(number).catch(() => null);
      if (cancelled || !result) return;
      setStatus((prev) => (prev === result.status ? prev : result.status));
    }

    const timer = window.setInterval(poll, POLL_MS);
    // Вернулись во вкладку — сразу обновляем, не ждём следующего тика.
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [number, status]);

  useEffect(() => {
    if (status !== "READY_FOR_PICKUP" || notifiedRef.current) return;
    notifiedRef.current = true;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Заказ готов", { body: `${number} можно забирать`, tag: number });
    }
  }, [status, number]);

  function confirmReceived() {
    setError("");
    startTransition(async () => {
      const result = await confirmOrderReceived(number);
      if (!result.ok) return setError(result.error);
      setStatus("DONE");
      router.refresh();
    });
  }

  // Этапы без обратного отсчёта, DONE/CANCELLED сюда не входят — как и в
  // исходной вёрстке, "выполнено" читается по заполненным барам, без
  // отдельного финального шага.
  const stages = ALLOWED_STATUSES_BY_FULFILLMENT[fulfillment].filter(
    (s): s is Exclude<Status, "CANCELLED" | "DONE"> => s !== "CANCELLED" && s !== "DONE",
  );
  const currentIndex = stages.indexOf(status as (typeof stages)[number]);
  const isDone = status === "DONE";
  const isCancelled = status === "CANCELLED";
  const isReady = fulfillment === "PICKUP" && status === "READY_FOR_PICKUP";
  const onTheWay = fulfillment === "DELIVERY" && (status === "HANDED_TO_COURIER" || status === "DELIVERING");
  const gridColsClass = stages.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4";

  return (
    <>
      {isReady && (
        <div
          role="status"
          className="anim-pop mb-6 rounded-s bg-tint-mint px-5 py-4 text-[14px] font-semibold text-ink"
        >
          🎉 Заказ готов — можно забирать в кафе.
        </div>
      )}

      {onTheWay && (
        <div role="status" className="anim-pop mb-6 overflow-hidden rounded-[22px] border border-plum/20 bg-tint-sky p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-2 text-plum shadow-s">
              <Truck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight">Курьер везёт ваш заказ</p>
              <p className="mt-1 text-[12.5px] leading-snug text-ink-2">
                Получили? Нажмите кнопку — мы закроем заказ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={confirmReceived}
            disabled={pending}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-btn px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition duration-200 active:scale-[0.98] disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {pending ? "Подтверждаем…" : "Заказ получен"}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-[12.5px] text-cherry">
              {error}
            </p>
          )}
        </div>
      )}

      {isDone && fulfillment === "DELIVERY" && (
        <div role="status" className="anim-pop mb-6 flex items-center gap-3 rounded-s bg-tint-mint px-5 py-4 text-[14px] font-semibold">
          <span className="icon-pop grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2 text-mint-deep">
            <Check className="h-4 w-4" strokeWidth={2.2} />
          </span>
          Заказ получен. Приятного аппетита!
        </div>
      )}

      {isCancelled && (
        <div role="status" className="mb-6 rounded-s bg-tint-blush px-5 py-4 text-[14px] font-semibold text-cherry">
          Заказ отменён.
        </div>
      )}

      {/* Полный таймлайн — по умолчанию свёрнут: баннеры выше уже говорят
          главное («готов», «курьер везёт»), а список из 3-4 этапов на
          телефоне занимал экран целиком ради информации, которая нужна не
          всегда. В шапке — текущий этап и мини-прогресс, видно и свёрнутым. */}
      <Collapsible
        defaultOpen={false}
        className="rounded-[22px] border border-hair bg-paper-2/70 px-4 py-3"
        contentClassName="pt-5"
        summary={
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-1.5 flex-1 max-w-[120px] gap-1" aria-hidden>
              {stages.map((key, i) => (
                <span
                  key={key}
                  className={`h-full flex-1 rounded-full transition-colors duration-500 ${
                    isDone || i <= currentIndex ? "bg-cherry" : "bg-hair"
                  }`}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-micro font-bold uppercase tracking-[0.14em] text-ink-3">
                Этапы заказа
              </span>
              <b className="block truncate text-[13.5px] font-bold">
                {isDone ? "Выполнен" : ORDER_STATUS_LABELS[status]}
              </b>
            </span>
          </span>
        }
      >
        <div className={`grid grid-cols-2 gap-y-6 ${gridColsClass}`}>
          {stages.map((key, i) => {
            const done = isDone || i < currentIndex;
            const now = !isDone && i === currentIndex;
            return (
              <div key={key} className="relative pr-4 pt-6">
                <span
                  className={`absolute left-0 right-4 top-0 h-[3px] rounded-full transition-colors duration-500 ${
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
      </Collapsible>
    </>
  );
}
