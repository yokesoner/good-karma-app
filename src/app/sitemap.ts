import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/siteUrl";

// /sitemap.xml — раньше отсутствовал: поисковик мог найти страницы блюд
// только переходя по ссылкам с уже проиндексированных, теперь у него есть
// полный список сразу. Категории и товары берём из БД, а не из
// data/design-data.json — то же самое, что видит сейчас live-каталог, а
// не сид на момент последнего запуска seed.ts. lastModified намеренно не
// указан: ни у Product, ни у Category нет updatedAt в схеме, а
// подставлять текущую дату — значит соврать поисковику, что страница
// меняется чаще, чем на самом деле (Google прямо предупреждает, что это
// снижает доверие к полю).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    db.category.findMany({ select: { id: true } }),
    db.product.findMany({ where: { isHidden: false }, select: { slug: true } }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/menu`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/promotions`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/wok-builder`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/karma-club/rules`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/menu/${c.id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${encodeURIComponent(p.slug)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
