import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminOrderAlerts } from "@/components/admin/AdminOrderAlerts";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { checkAndNotifyExpiringPromotions } from "@/server/promoMaintenance";

const adminNavigation = [
  ["Главная", "/admin"],
  ["Заказы", "/admin/orders"],
  ["Товары", "/admin/products"],
  ["Категории", "/admin/categories"],
  ["Конструктор вока", "/admin/wok-builder"],
  ["Акции", "/admin/promotions"],
  ["Karma Club", "/admin/karma-club"],
  ["Доставка", "/admin/delivery-zones"],
  ["Уведомления", "/admin/notifications"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const navigation = admin.role === "OWNER" ? [...adminNavigation, ["Команда", "/admin/team"] as const] : adminNavigation;

  // Не блокирует загрузку страницы (без await в цепочке рендера) — раз в
  // проекте нет cron, любой заход в админку заодно и проверяет истекающие
  // акции. Ошибка здесь не должна ронять саму админку.
  void checkAndNotifyExpiringPromotions().catch((error) => {
    console.error("Не удалось проверить истекающие акции", error);
  });

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-hair bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-wrap items-center justify-between gap-5 px-5 py-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin" aria-label="Главная — админка Good Karma"><BrandMark /></Link>
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
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <div className="border-b border-hair xl:hidden">
        <nav className="mx-auto flex max-w-wrap gap-5 overflow-x-auto px-5 py-3 md:px-8">
          {adminNavigation.map(([label, href]) => (
            <Link key={href} href={href} className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-2 hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-wrap px-5 py-8 md:px-8 md:py-12">{children}</main>
    </div>
  );
}
