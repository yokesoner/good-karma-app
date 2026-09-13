import type { Metadata } from "next";
import { KarmaClubSection } from "@/components/KarmaClubSection";
import { PromotionsSection } from "@/components/PromotionsSection";

export const metadata: Metadata = {
  title: "Акции — Гуд Карма",
  description:
    "Акции, промокоды и Karma Club Гуд Карма: скидки, баллы, уровни и подарки в одном месте.",
};

export default function PromotionsPage() {
  return (
    <main className="promo-page">
      <PromotionsSection />
      <div className="mx-auto max-w-wrap px-5 md:px-16">
        <KarmaClubSection embedded />
      </div>
    </main>
  );
}
