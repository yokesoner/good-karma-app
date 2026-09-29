import { redirect } from "next/navigation";

// Без force-dynamic Next пререндерит эту страницу статически и отдаёт
// 307 без заголовка Location: браузер доходит до акций только через
// meta-refresh/JS, а поисковики и превью ссылок в мессенджерах редирект не
// видят. Динамический рендер отвечает настоящим 307 с Location.
export const dynamic = "force-dynamic";

export default function KarmaClubPage() {
  redirect("/promotions#karma-club");
}
