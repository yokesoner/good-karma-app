import type { Metadata } from "next";
import { AdminBrowserAlertsSettings } from "@/components/admin/AdminBrowserAlertsSettings";
import { AdminTelegramLinkCard } from "@/components/admin/AdminTelegramLinkCard";
import { getAdminTelegramStatus } from "@/server/adminNotifications";

export const metadata: Metadata = { title: "Уведомления — админка Гуд Карма" };

export default async function AdminNotificationsPage() {
  const status = await getAdminTelegramStatus();

  return (
    <div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Личные настройки</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Уведомления</h1>
        <p className="mt-2 text-sm text-ink-2">
          Это только ваши каналы — у каждого администратора своя привязка и свои настройки браузера.
        </p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <AdminTelegramLinkCard initialLinked={status.linked} />
        <AdminBrowserAlertsSettings />
      </div>
    </div>
  );
}
