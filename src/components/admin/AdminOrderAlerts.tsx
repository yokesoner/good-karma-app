"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isAdminAlertSoundEnabled, playAdminAlertSound } from "@/lib/adminAlertSound";
import { FULFILLMENT_LABELS } from "@/lib/orderLabels";
import { formatMoney } from "@/lib/money";
import { getRecentOrdersForAdmin } from "@/server/adminOrders";

const POLL_MS = 6000;
const MAX_ALERTS = 20;

type Alert = {
  id: string;
  number: string;
  totalCents: number;
  fulfillment: keyof typeof FULFILLMENT_LABELS;
  createdAt: string;
};

export function AdminOrderAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [open, setOpen] = useState(false);
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      let fresh: Alert[];
      try {
        fresh = await getRecentOrdersForAdmin(lastSeenRef.current);
      } catch {
        return;
      }
      if (cancelled || fresh.length === 0) return;

      lastSeenRef.current = fresh[0]!.createdAt;
      setAlerts((prev) => [...fresh, ...prev].slice(0, MAX_ALERTS));
      setUnseen((count) => count + fresh.length);

      if (isAdminAlertSoundEnabled()) playAdminAlertSound();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        for (const order of fresh) {
          new Notification(`Новый заказ ${order.number}`, {
            body: `${formatMoney(order.totalCents)} · ${FULFILLMENT_LABELS[order.fulfillment]}`,
            tag: order.id,
          });
        }
      }
    }

    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggleOpen() {
    setOpen((value) => !value);
    setUnseen(0);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Новые заказы"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-hair transition hover:border-plum"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3a6 6 0 0 0-6 6v3.2c0 .5-.18 1-.5 1.4L4 15.5c-.6.7-.1 1.8.8 1.8h14.4c.9 0 1.4-1.1.8-1.8l-1.5-1.9a2.2 2.2 0 0 1-.5-1.4V9a6 6 0 0 0-6-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unseen > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cherry px-1 text-[10px] font-bold text-white">
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[320px] overflow-hidden rounded-[24px] border border-hair bg-paper-2 shadow-l">
          <div className="border-b border-hair px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2">Новые заказы</p>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {alerts.length === 0 && <p className="p-5 text-sm text-ink-2">Пока тихо — новых заказов не было.</p>}
            {alerts.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 border-b border-hair-soft px-5 py-3 transition last:border-b-0 hover:bg-paper-3"
              >
                <div>
                  <p className="text-sm font-semibold text-plum">{order.number}</p>
                  <p className="mt-0.5 text-xs text-ink-3">{FULFILLMENT_LABELS[order.fulfillment]}</p>
                </div>
                <p className="text-sm font-semibold">{formatMoney(order.totalCents)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
