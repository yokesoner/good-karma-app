import type { Metadata } from "next";
import { getLoyaltyCustomer } from "@/server/adminLoyalty";
import { AdminLoyaltyPanel } from "@/components/admin/AdminLoyaltyPanel";

export const metadata: Metadata = { title: "Карта клиента — админка Гуд Карма" };

// Страница, на которую ведёт QR с личной карты клиента (/profile,
// KarmaPass.tsx): сотрудник открывает ссылку камерой телефона, попадает
// сюда — весь раздел (protected) уже требует входа в /admin (см. layout.tsx
// этой группы), поэтому дополнительной проверки здесь не нужно, а сам
// код в URL вне входа в админку ни на что не годится.
export default async function AdminLoyaltyPage({ params }: { params: { code: string } }) {
  const customer = await getLoyaltyCustomer(params.code);

  if (!customer) {
    return (
      <div className="mx-auto max-w-[480px] rounded-[28px] border border-hair bg-paper-2 p-8 text-center">
        <p className="text-[15px] font-semibold">Карта не найдена</p>
        <p className="mt-2 text-[13px] text-ink-2">Такого кода Karma Club нет в базе. Возможно, ссылка устарела — попросите клиента обновить страницу профиля.</p>
      </div>
    );
  }

  return <AdminLoyaltyPanel code={params.code} initial={customer} />;
}
