"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_MS = 15_000;

// Список заказов — серверный компонент, сам он не обновляется. Раз в 15
// секунд (и сразу при возвращении во вкладку) мягко перечитываем его, чтобы
// новые заказы и смена статусов появлялись без ручного обновления страницы
// — как живая очередь в приложениях для ресторанов. Тот же честный
// поллинг, что у AdminOrderAlerts и OrderStatusLive, без SSE/WebSocket.
export function AdminOrdersAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return null;
}
