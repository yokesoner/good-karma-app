"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Copy, Truck } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  canOrderYandexDelivery,
  nextStepFor,
  type OrderFulfillmentKey,
  type OrderStatusKey,
} from "@/lib/orderFlow";
import { useToast } from "@/lib/toast";
import { setAdminOrderStatus, startYandexDelivery } from "@/server/adminOrders";

// Кнопки заказа для админа, которому некогда выбирать статусы из списка:
// один следующий шаг («Принять в работу», «Готов к выдаче», «Выдан
// клиенту») и «Яндекс Доставка» — ссылка на кабинет Яндекса, по нажатию на
// которую заказ сам получает статус «Доставляется». Дальше покупатель
// подтверждает получение на странице своего заказа.
export function AdminOrderActions({
  orderId,
  status,
  fulfillment,
  yandexUrl,
  courierBrief,
  layout = "card",
}: {
  orderId: string;
  status: OrderStatusKey;
  fulfillment: OrderFulfillmentKey;
  yandexUrl: string;
  /** Готовый текст для формы курьера — копируется в буфер обмена. */
  courierBrief: string;
  layout?: "card" | "detail";
}) {
  const router = useRouter();
  const showToast = useToast((state) => state.show);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const step = nextStepFor({ status, fulfillment });
  const yandex = canOrderYandexDelivery({ status, fulfillment });
  const waitingForCustomer = fulfillment === "DELIVERY" && status === "DELIVERING";
  const detail = layout === "detail";

  async function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError("");
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok) setError(result.error);
      else router.refresh();
    } catch {
      setError("Нет связи с сервером — попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(courierBrief);
      showToast("Данные для курьера скопированы");
    } catch {
      showToast("Не удалось скопировать — выделите текст вручную");
    }
  }

  function onYandexClick() {
    // Ссылка открывается сама (target=_blank) в том же жесте пользователя —
    // так её не заблокирует всплывающий фильтр Safari. Параллельно кладём
    // адрес и телефон в буфер (Яндекс не принимает их из ссылки) и меняем
    // статус заказа.
    void navigator.clipboard?.writeText(courierBrief).then(
      () => showToast("Данные скопированы — вставьте в форму Яндекса"),
      () => undefined,
    );
    void run(() => startYandexDelivery(orderId));
  }

  const primaryClass =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-plum-deep px-5 text-[11px] font-bold uppercase tracking-[0.08em] text-btn-fg transition duration-200 active:scale-[0.97] disabled:opacity-50";
  const quietClass =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-hair bg-paper-2 px-5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink transition duration-200 active:scale-[0.97] disabled:opacity-50";

  if (!step && !yandex && !waitingForCustomer) return null;

  return (
    <div className={cn("space-y-2.5", detail && "rounded-[24px] border border-hair bg-paper-2 p-4")}>
      {waitingForCustomer && (
        <p className="flex items-center gap-2 rounded-2xl bg-tint-sky px-4 py-3 text-[12.5px] leading-snug text-ink-2">
          <Truck className="h-4 w-4 shrink-0 text-plum" />
          Передан курьеру. Клиент сам подтвердит получение на странице заказа.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {yandex && (
          <a
            href={yandexUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onYandexClick}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.08em] transition duration-200 active:scale-[0.97]",
              // Для нового заказа Яндекс — вторая по важности кнопка (сначала
              // «Принять в работу»); для готовящегося — главная.
              status === "NEW"
                ? "border border-[#E8B800]/60 bg-[#FFD53D]/25 text-ink"
                : "bg-[#FFD53D] text-[#2A2029] shadow-[0_10px_24px_-14px_rgba(180,140,0,.8)]",
            )}
          >
            <Truck className="h-4 w-4" />
            Яндекс Доставка
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
        {step && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => setAdminOrderStatus(orderId, step.to))}
            className={yandex && status !== "NEW" ? quietClass : primaryClass}
          >
            {busy ? "Сохраняем…" : (
              <>
                <Check className="h-4 w-4" strokeWidth={2.2} />
                {step.label}
              </>
            )}
          </button>
        )}
      </div>

      {detail && yandex && (
        <button
          type="button"
          onClick={() => void copyBrief()}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-[11px] font-semibold text-plum transition active:scale-[0.98]"
        >
          <Copy className="h-4 w-4" />
          Скопировать данные для курьера
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-tint-blush px-4 py-3 text-[12.5px] text-cherry">
          {error}
        </p>
      )}
    </div>
  );
}
