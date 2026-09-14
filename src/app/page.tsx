import { Hero } from "@/components/Hero";
import { MenuSection } from "@/components/MenuSection";
import { PromotionsSection } from "@/components/PromotionsSection";
import { ExperienceSections } from "@/components/ExperienceSections";
import { Footer } from "@/components/Footer";
import { CulturalMarquee } from "@/components/CulturalMarquee";
import { Reveal } from "@/components/Reveal";

// Next.js рендерит каждую секцию на сервере при каждом запросе — заготовка
// под ISR (export const revalidate = 60), как только меню начнёт меняться
// из админки чаще, чем раз в минуту.
//
export default function HomePage() {
  return (
    <main>
      <Hero />
      <CulturalMarquee />
      <Reveal>
        <MenuSection />
      </Reveal>
      <Reveal>
        <ExperienceSections />
      </Reveal>
      <Reveal className="px-5 md:px-16">
        <PromotionsSection compact />
      </Reveal>
      <Footer />
    </main>
  );
}
