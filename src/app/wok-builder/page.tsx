import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { WokBuilder } from "@/components/WokBuilder";

export const metadata: Metadata = {
  title: "Собери свой ВОК",
  description: "Конструктор вока: выберите основу, начинку и соус — мы приготовим по вашему рецепту.",
  alternates: { canonical: "/wok-builder" },
};

export default async function WokBuilderPage() {
  const [bases, proteins, sauces, product] = await Promise.all([
    db.wokBase.findMany({ orderBy: { extraCents: "asc" } }),
    db.wokProtein.findMany({ orderBy: { extraCents: "asc" } }),
    db.wokSauce.findMany({ orderBy: { extraCents: "asc" } }),
    db.product.findUnique({ where: { slug: "custom-wok" } }),
  ]);

  if (!product || bases.length === 0 || proteins.length === 0 || sauces.length === 0) {
    notFound();
  }

  return (
    <main className="wok-page mx-auto max-w-wrap px-5 py-10 md:px-16 md:py-14">
      <div className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <span className="mb-3 block text-[10.5px] font-bold uppercase tracking-[0.22em] text-cherry">
            Wok atelier · три шага
          </span>
          <h1 className="max-w-[13ch] text-[39px] font-bold leading-[0.98] tracking-[-0.05em] md:text-[58px]">
            Ваша идеальная миска
          </h1>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-2 md:text-right">
            Основа, начинка и соус — вы задаёте характер, мы отвечаем за баланс, свежесть и правильный огонь.
          </p>
          {/* Переносится пилюля целиком, а не текст внутри неё. */}
          <div className="flex flex-wrap gap-2">
            {["3 минуты на огне", "готовим после заказа"].map((item) => (
              <span key={item} className="whitespace-nowrap rounded-full border border-white/70 bg-paper-2/65 px-3 py-2 text-micro font-bold uppercase tracking-[0.08em] text-ink-3 shadow-s backdrop-blur-md">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <WokBuilder
        productId={product.id}
        productName={product.name}
        basePriceCents={product.priceCents}
        bases={bases}
        proteins={proteins}
        sauces={sauces}
      />
    </main>
  );
}
