import type { Metadata } from "next";
import { AdminLoyaltySearch } from "@/components/admin/AdminLoyaltySearch";

export const metadata: Metadata = { title: "Карта клиента — админка Гуд Карма" };

export default function AdminLoyaltySearchPage() {
  return (
    <div className="mx-auto max-w-[480px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Karma Club</p>
      <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight md:text-4xl">Карта клиента</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
        Обычно сюда попадают по QR с карты клиента в его профиле — наведите камеру телефона на код. Если сканировать
        нечем, найдите клиента по номеру телефона.
      </p>
      <div className="mt-6 rounded-[26px] border border-hair bg-paper-2 p-5 md:p-6">
        <AdminLoyaltySearch />
      </div>
    </div>
  );
}
