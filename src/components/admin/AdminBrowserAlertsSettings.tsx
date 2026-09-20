"use client";

import { useEffect, useState } from "react";
import { isAdminAlertSoundEnabled, playAdminAlertSound, setAdminAlertSoundEnabled } from "@/lib/adminAlertSound";

type PermissionState = NotificationPermission | "unsupported";

export function AdminBrowserAlertsSettings() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(isAdminAlertSoundEnabled());
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAdminAlertSoundEnabled(next);
    if (next) playAdminAlertSound();
  }

  return (
    <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7">
      <h2 className="text-xl font-semibold">Браузер</h2>
      <p className="mt-2 text-sm text-ink-2">
        Пока админка открыта в этой вкладке — звук и всплывающее уведомление при каждом новом заказе.
      </p>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-paper-3 px-4 py-3">
          <span className="text-sm">Системные уведомления</span>
          {permission === "granted" && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-2">Включены</span>
          )}
          {permission === "unsupported" && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">Не поддерживается</span>
          )}
          {permission === "denied" && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-cherry">Заблокированы в браузере</span>
          )}
          {permission === "default" && (
            <button
              type="button"
              onClick={enableNotifications}
              className="rounded-full border border-hair px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:border-plum"
            >
              Включить
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-paper-3 px-4 py-3">
          <span className="text-sm">Звук</span>
          <button
            type="button"
            onClick={toggleSound}
            className="rounded-full border border-hair px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:border-plum"
          >
            {soundEnabled ? "Включён" : "Выключен"}
          </button>
        </div>
      </div>
    </section>
  );
}
