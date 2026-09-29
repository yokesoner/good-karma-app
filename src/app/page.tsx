import { Hero } from "@/components/Hero";
import { MenuSection } from "@/components/MenuSection";
import { HomePromotions } from "@/components/HomePromotions";
import { ExperienceSections } from "@/components/ExperienceSections";
import { Footer } from "@/components/Footer";
import { CulturalMarquee } from "@/components/CulturalMarquee";

// Страница статическая и обновляется из админки через revalidatePath, но
// в карусели акций есть время — «идёт сейчас · до 18:00», «сегодня с
// 15:00». Без периодической регенерации эти подписи застывали бы до
// следующей правки в админке; минута — достаточная точность для витрины
// (применимость промокода всё равно проверяет сервер при заказе).
export const revalidate = 60;

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CulturalMarquee />
      {/* Меню и баннеры без <Reveal>: их карточки появляются сами (data-reveal) */}
      <MenuSection />
      <ExperienceSections />
      <HomePromotions />
      <Footer />
    </main>
  );
}
