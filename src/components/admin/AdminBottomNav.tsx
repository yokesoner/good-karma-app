"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, type AdminIconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type Tab = { href: string; label: string; icon: AdminIconName; match: (path: string) => boolean };

const isDashboard = (path: string) => path === "/admin";
const isOrders = (path: string) => path.startsWith("/admin/orders");
const isMenu = (path: string) => path.startsWith("/admin/products");

// Как в приложениях для партнёров доставки: четыре главных раздела всегда
// под большим пальцем, всё остальное — за «Ещё». «Ещё» подсвечивается на
// любом из вторичных разделов (акции, доставка, баннеры…), чтобы было
// понятно, где ты находишься.
const TABS: Tab[] = [
  { href: "/admin/orders", label: "Заказы", icon: "orders", match: isOrders },
  { href: "/admin/products", label: "Меню", icon: "menu", match: isMenu },
  { href: "/admin", label: "Сводка", icon: "stats", match: isDashboard },
  {
    href: "/admin/more",
    label: "Ещё",
    icon: "more",
    match: (path) => !isDashboard(path) && !isOrders(path) && !isMenu(path),
  },
];

// Только на телефоне (< md): на планшете и десктопе есть горизонтальная
// навигация в шапке.
export function AdminBottomNav({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Разделы админки"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hair bg-paper/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_48px_-28px_rgba(35,20,32,.55)] backdrop-blur-2xl md:hidden"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition duration-200 active:scale-90",
              active ? "text-ink" : "text-ink-3",
            )}
          >
            <span
              className={cn(
                "relative grid h-7 w-12 place-items-center rounded-full transition-colors duration-300",
                active ? "bg-tint-sakura" : "bg-transparent",
              )}
            >
              <AdminIcon name={tab.icon} className="h-[21px] w-[21px]" strokeWidth={active ? 1.9 : 1.6} />
              {tab.icon === "orders" && newOrders > 0 && (
                <span
                  key={newOrders}
                  className="icon-pop absolute -right-0.5 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-cherry px-1 text-[10px] font-bold leading-none text-white"
                >
                  {newOrders > 9 ? "9+" : newOrders}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
