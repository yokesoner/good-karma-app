import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminOrderAlerts } from "@/components/admin/AdminOrderAlerts";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getAdminOrderCounts } from "@/server/adminOrderCounts";
import { checkAndNotifyExpiringPromotions } from "@/server/promoMaintenance";

// Полный список разделов — для верхней навигации на десктопе/планшете.
// На телефоне вместо неё нижняя панель (AdminBottomNav) и страница «Ещё»
// (/admin/more, тот же список со значками и пояснениями).
const adminNavigation = [
  ["Главная", "/admin"],
  ["Заказы", "/admin/orders"],
  ["Меню", "/admin/products"],
  ["Категории", "/admin/categories"],
  ["Конструктор вока", "/admin/wok-builder"],
  ["Акции", "/admin/promotions"],
  ["Баннеры", "/admin/banners"],
  ["Karma Club", "/admin/karma-club"],
  ["Карта клиента", "/admin/loyalty"],
  ["Доставка", "/admin/delivery-zones"],
  ["Уведомления", "/admin/notifications"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const navigation = admin.role === "OWNER" ? [...adminNavigation, ["Команда", "/admin/team"] as const] : adminNavigation;
  const counts = await getAdminOrderCounts().catch(() => null);

  // Не блокирует загрузку страницы (без await в цепочке рендера) — раз в
  // проекте нет cron, любой заход в админку заодно и проверяет истекающие
  // акции. Ошибка здесь не должна ронять саму админку.
  void checkAndNotifyExpiringPromotions().catch((error) => {
    console.error("Не удалось проверить истекающие акции", error);
  });

  return (
    <div className="min-h-screen bg-paper pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-hair bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-wrap items-center justify-between gap-5 px-4 py-2.5 md:px-8 md:py-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" aria-label="Главная — админка Good Karma" className="flex items-center gap-2.5 text-cherry">
              <BrandMark className="h-8 w-8" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink md:hidden">Админка</span>
            </Link>
            <nav className="hidden items-center gap-5 xl:flex">
              {navigation.map(([label, href]) => (
                <Link key={href} href={href} className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-2 hover:text-ink">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <AdminOrderAlerts />
            <span className="hidden text-xs text-ink-2 md:inline">{admin.name}</span>
            <div className="hidden md:block">
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </header>
      <div className="hidden border-b border-hair md:block xl:hidden">
        <nav className="mx-auto flex max-w-wrap gap-5 overflow-x-auto px-8 py-3">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href} className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-2 hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-wrap px-4 py-5 md:px-8 md:py-12">{children}</main>
      <AdminBottomNav newOrders={counts?.new ?? 0} />
    </div>
  );
}
