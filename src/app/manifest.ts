import type { MetadataRoute } from "next";

// Раньше манифеста не было вообще — «На экран «Домой»» на iPhone добавлял
// обычную закладку (открывается внутри Safari, без своего chrome), а не
// полноценное веб-приложение. Разница критична для уведомлений: Notification
// API на iOS Safari (см. AdminBrowserAlertsSettings.tsx) появляется ТОЛЬКО
// у установленного как standalone-приложение сайта (iOS 16.4+), открытого
// именно с иконки на экране «Домой» — обычная вкладка Safari его никогда
// не получит, это ограничение самой iOS, не баг сайта. display: "standalone"
// здесь — то, что делает установку «настоящим приложением», а не закладкой.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Гуд Карма — админка",
    short_name: "Гуд Карма",
    description: "Управление заказами, меню и Karma Club паназиатского кафе Гуд Карма.",
    start_url: "/admin",
    display: "standalone",
    background_color: "#F5F0E8",
    theme_color: "#3A2338",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
