import Link from "next/link";
import type { Metadata } from "next";
import { RecentOrdersList } from "@/components/RecentOrdersList";
import { TrackOrderForm } from "@/components/TrackOrderForm";
import { getMyRecentOrders } from "@/server/orderTracking";

export const metadata: Metadata = {
  title: "Отследить заказ",
  robots: { index: false },
};

export default async function TrackPage() {
  const orders = await getMyRecentOrders();
  const hasOrders = orders.length > 0;

  return (
    <main className="mx-auto max-w-wrap px-5 py-10 md:px-16">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">Заказ</span>
      <h1 className="mt-3 text-[26px] font-bold tracking-tight md:text-[32px]">
        {hasOrders ? "Ваши заказы на этом устройстве" : "Отследить заказ"}
      </h1>
      <p className="mt-2 max-w-[46ch] text-[14px] text-ink-2">
        {hasOrders
          ? "Мы запомнили их в этом браузере — не нужно искать ссылку или помнить номер."
          : "Введите номер заказа и телефон, который указывали при оформлении."}
      </p>

      {hasOrders && (
        <div className="mt-8">
          <RecentOrdersList orders={orders} />
        </div>
      )}

      <div className="mt-8">
        {hasOrders && (
          <p className="mx-auto mb-4 max-w-[440px] text-[12px] font-bold uppercase tracking-[0.1em] text-ink-3">
            Другой заказ или новое устройство
          </p>
        )}
        <TrackOrderForm />
      </div>

      <div className="mx-auto mt-6 max-w-[440px] rounded-2xl bg-paper-3 px-5 py-4 text-[12.5px] leading-relaxed text-ink-2">
        Не помните номер? Он есть в подтверждении Telegram-бота. А если хотите, чтобы вся история
        заказов была под рукой на любом устройстве —{" "}
        <Link href="/profile" className="font-semibold text-cherry hover:underline">
          войдите в профиль
        </Link>
        .
      </div>
    </main>
  );
}
