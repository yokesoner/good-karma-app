// Единая точка, где читаем домен сайта. Раньше SITE_URL читали по месту
// (adminNotify.ts) как необязательную переменную ради одной кликабельной
// ссылки в Telegram — без неё уведомление просто приходило без ссылки.
// Теперь на неё завязаны ещё и QR-код карты лояльности (сотрудник открывает
// эту ссылку камерой телефона на кассе) и SEO-метаданные (metadataBase,
// canonical-ссылки, sitemap.xml, robots.txt — см. layout.tsx, sitemap.ts,
// robots.ts): без правильного SITE_URL в проде QR ведёт на localhost, а
// canonical/OG-ссылки указывают на несуществующий адрес. Поэтому в
// DEPLOYMENT.md эта переменная теперь обязательная, не просто желательная.
export const SITE_URL = process.env.SITE_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";

if (process.env.NODE_ENV === "production" && !process.env.SITE_URL?.trim()) {
  // Не бросаем ошибку — сайт всё равно должен подняться, просто с кривыми
  // ссылками, а не упасть целиком из-за одной переменной. Но в логах PM2
  // это должно быть заметно, а не тихо остаться как «localhost:3000» в
  // canonical-теге и QR-коде на кассе.
  console.warn(
    "SITE_URL не задан в проде — canonical-ссылки, sitemap.xml и QR-код карты Karma Club будут указывать на http://localhost:3000. Задайте SITE_URL в .env боевого сервера.",
  );
}
