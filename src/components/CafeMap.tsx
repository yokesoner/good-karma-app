import { CAFE, CAFE_ADDRESS } from "@/lib/delivery";

// Виджет Яндекс.Карт (map-widget) — обычная "поделиться → встроить на сайт"
// ссылка, без API-ключа и регистрации, как и раньше. Геокодер (проверка
// адреса доставки, src/lib/geocoder.ts) — отдельный бесплатный сервис
// (OpenStreetMap/Nominatim), это только отображение карты, разные вещи.
export function CafeMap({ className = "" }: { className?: string }) {
  const embedSrc = `https://yandex.ru/map-widget/v1/?ll=${CAFE.lng}%2C${CAFE.lat}&z=16&l=map&pt=${CAFE.lng},${CAFE.lat},pm2rdm`;
  const openUrl = `https://yandex.ru/maps/?ll=${CAFE.lng}%2C${CAFE.lat}&z=17&pt=${CAFE.lng},${CAFE.lat},pm2rdm`;

  return (
    <div className={className}>
      <iframe
        title="Карта — где находится Гуд Карма"
        src={embedSrc}
        loading="lazy"
        className="h-full min-h-[220px] w-full rounded-[20px] border-0"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <span className="text-current opacity-75">{CAFE_ADDRESS}</span>
        <a href={openUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:opacity-80">
          Открыть карту крупнее ↗
        </a>
      </div>
    </div>
  );
}
