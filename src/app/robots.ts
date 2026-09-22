import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

// /robots.txt генерируется этим файлом (соглашение Next.js App Router) —
// раньше файла не было вообще, поисковики ползали по всему сайту без
// подсказки, что админку, чекаут и приватные страницы заказа/профиля
// индексировать незачем (там либо форма входа, либо чужому человеку
// бесполезные персональные данные одного покупателя). /admin продублирован
// и через noindex-метатег (src/app/admin/layout.tsx) — так надёжнее: этот
// файл экономит краулинг-бюджет, а noindex подстрахует, если на страницу
// всё же придут по внешней ссылке.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/checkout", "/order/", "/track", "/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
