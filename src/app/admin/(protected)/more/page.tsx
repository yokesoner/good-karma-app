import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminIcon, ChevronRight, type AdminIconName } from "@/components/icons";
import { getCurrentAdmin } from "@/lib/adminAuth";

export const metadata: Metadata = { title: "Ещё — админка Гуд Карма" };

type Row = { href: string; label: string; hint: string; icon: AdminIconName };

const groups: { title: string; rows: Row[] }[] = [
  {
    title: "Каталог",
    rows: [
      { href: "/admin/categories", label: "Категории", hint: "Названия, фото и порядок", icon: "categories" },
      { href: "/admin/wok-builder", label: "Конструктор вока", hint: "Основы, начинки и соусы", icon: "wok" },
    ],
  },
  {
    title: "Продвижение",
    rows: [
      { href: "/admin/banners", label: "Баннеры сайта", hint: "Тексты и картинки на главной", icon: "banner" },
      { href: "/admin/promotions", label: "Акции и промокоды", hint: "Скидки, расписание, баннер акций", icon: "promo" },
      { href: "/admin/karma-club", label: "Karma Club", hint: "Уровни и награды за баллы", icon: "karma" },
    ],
  },
  {
    title: "Работа кафе",
    rows: [
      { href: "/admin/loyalty", label: "Карта клиента", hint: "Поиск по телефону — начислить или списать баллы", icon: "search" },
      { href: "/admin/delivery-zones", label: "Доставка", hint: "Зоны, цены, бесплатная доставка", icon: "delivery" },
      { href: "/admin/notifications", label: "Уведомления", hint: "Telegram и звук о новых заказах", icon: "bell" },
    ],
  },
];

// Всё, что не поместилось на нижнюю панель: на телефоне это замена длинной
// горизонтальной ленты со ссылками, которую приходилось листать вбок.
export default async function AdminMorePage() {
  const admin = await getCurrentAdmin();
  const sections =
    admin?.role === "OWNER"
      ? [
          ...groups,
          {
            title: "Доступ",
            rows: [{ href: "/admin/team", label: "Команда", hint: "Администраторы и роли", icon: "team" as const }],
          },
        ]
      : groups;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Настройки</p>
      <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight md:text-4xl">Ещё</h1>

      {admin && (
        <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-hair bg-paper-2 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tint-sakura text-[15px] font-bold text-cherry">
            {admin.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{admin.name}</p>
            <p className="truncate text-[12px] text-ink-3">
              {admin.email} · {admin.role === "OWNER" ? "владелец" : "сотрудник"}
            </p>
          </div>
          <AdminLogoutButton />
        </div>
      )}

      {sections.map((group) => (
        <section key={group.title} className="mt-6">
          <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">{group.title}</h2>
          <div className="overflow-hidden rounded-[22px] border border-hair bg-paper-2">
            {group.rows.map((row) => (
              <Link
                key={row.href}
                href={row.href}
                className="flex items-center gap-3.5 border-b border-hair-soft px-4 py-3.5 transition-colors last:border-b-0 active:bg-paper-3 hover:bg-paper-3/60"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tint-plum text-plum">
                  <AdminIcon name={row.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">{row.label}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-ink-3">{row.hint}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
