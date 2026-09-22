import { CAFE, CAFE_ADDRESS, CAFE_CITY } from "@/lib/delivery";
import { SITE_URL } from "@/lib/siteUrl";

// JSON-LD для локального поиска и карт (Google, Яндекс) — schema.org
// Restaurant. Без этого поисковик видит только текст на странице и
// вынужден сам угадывать адрес/часы/кухню; с разметкой — показывает
// карточку заведения (адрес, режим работы, карта) прямо в выдаче.
//
// telephone/email намеренно не указаны: и в Footer.tsx, и в прототипе,
// откуда он унаследован, там до сих пор стоят плейсхолдеры
// (+7 (812) 000-00-00 — код Петербурга для кафе в Ставрополе, и
// hi@goodkarma.cafe — несуществующий домен). Публиковать их в
// машиночитаемой разметке для поисковика хуже, чем не публиковать вообще:
// это будет воспринято как настоящие контакты бизнеса. Добавьте оба поля
// сюда и замените плейсхолдеры в Footer.tsx, как только появятся реальные
// телефон и почта.
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Гуд Карма",
    url: SITE_URL,
    image: `${SITE_URL}/assets/backgrounds/hero_two_worlds.png`,
    servesCuisine: ["Japanese", "Asian", "Pan-Asian"],
    priceRange: "₽₽",
    address: {
      "@type": "PostalAddress",
      streetAddress: CAFE_ADDRESS.replace(`${CAFE_CITY}, `, ""),
      addressLocality: CAFE_CITY,
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: CAFE.lat,
      longitude: CAFE.lng,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "11:00",
      closes: "23:00",
    },
    hasDeliveryMethod: "https://schema.org/DeliveryModeOwnFleet",
    acceptsReservations: "False",
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify экранирует кавычки сам; закрывающий </script>
      // внутри JSON появиться не может — источник данных не пользовательский ввод.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
