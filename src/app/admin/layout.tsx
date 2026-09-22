import type { Metadata } from "next";

// Оборачивает и /admin/login, и всё /admin/(protected)/* одним местом:
// 1) noindex — админка не должна попадать в поиск (продублировано ещё и
//    в /robots.txt, см. src/app/robots.ts, — так надёжнее).
// 2) свой title.template ("%s" без хвоста) — перекрывает шаблон корневого
//    layout.tsx ("%s — Гуд Карма"), иначе каждый заголовок в админке (уже
//    оканчивающийся на «— админка Гуд Карма») задваивался бы до
//    «Заказы — админка Гуд Карма — Гуд Карма». Сами заголовки страниц
//    админки трогать не пришлось — они продолжают работать как раньше.
export const metadata: Metadata = {
  title: { template: "%s", default: "Админка — Гуд Карма" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
