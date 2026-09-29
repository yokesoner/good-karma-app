import { CAFE, CAFE_ADDRESS, CAFE_CITY } from "@/lib/delivery";
import { CAFE_PHONE } from "@/lib/contacts";
import { SITE_URL } from "@/lib/siteUrl";

// JSON-LD для локального поиска и карт (Google, Яндекс) — schema.org
// Restaurant. Без этого поисковик видит только текст на странице и
// вынужден сам угадывать адрес/часы/кухню; с разметкой — показывает
// карточку заведения (адрес, режим работы, карта) прямо в выдаче.
//
// Телефон — настоящий (src/lib/contacts.ts). email намеренно не указан:
// hi@goodkarma.cafe — заглушка на несуществующем домене, а публиковать
// выдуманный контакт в машиночитаемой разметке для поисковика хуже, чем не
// публиковать вообще. Добавьте email сюда, когда появится настоящая почта.
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Гуд Карма",
    url: SITE_URL,
    telephone: CAFE_PHONE,
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
