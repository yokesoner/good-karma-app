"use client";

import { useEffect, useState } from "react";
import { isAdminAlertSoundEnabled, playAdminAlertSound, setAdminAlertSoundEnabled } from "@/lib/adminAlertSound";

type PermissionState = NotificationPermission | "unsupported";

// iOS Safari не отдаёт window.Notification, пока сайт открыт обычной
// вкладкой — API появляется только у установленного на экран «Домой»
// сайта (display: standalone, см. manifest.ts) на iOS 16.4+, и то, только
// если открыть именно с иконки, а не из Safari. Это ограничение самой iOS,
// не что-то, что можно обойти кодом — но плоское «Не поддерживается» без
// объяснения выглядит как баг сайта, а не как факт про iOS.
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function AdminBrowserAlertsSettings() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [iosNotInstalled, setIosNotInstalled] = useState(false);

  useEffect(() => {
    setSoundEnabled(isAdminAlertSoundEnabled());
    const unsupported = typeof Notification === "undefined";
    setPermission(unsupported ? "unsupported" : Notification.permission);
    setIosNotInstalled(unsupported && isIOS() && !isStandalone());
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
          {permission === "unsupported" && !iosNotInstalled && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">Не поддерживается</span>
          )}
          {iosNotInstalled && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">Нужна установка</span>
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
        {iosNotInstalled && (
          <div className="rounded-2xl border border-gold/25 bg-tint-cream px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-2">
            <p className="font-semibold text-ink">На iPhone это работает только из установленного сайта</p>
            <p className="mt-1.5">
              Так устроен сам iOS Safari — обычная вкладка браузера уведомления не поддерживает никогда, это не
              баг сайта. Установите админку на экран «Домой»:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Нажмите «Поделиться» (значок со стрелкой вверх) внизу экрана</li>
              <li>Выберите «На экран «Домой»»</li>
              <li>Откройте админку с новой иконки — не из Safari</li>
            </ol>
            <p className="mt-2 text-ink-3">Нужен iOS 16.4 или новее.</p>
          </div>
        )}
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
