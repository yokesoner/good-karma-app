import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Оформление заказа — Гуд Карма",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="checkout-page mx-auto max-w-wrap px-5 py-8 md:px-16 md:py-12">
      <div className="mb-9 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-cherry">
            Последний шаг · ご注文
          </span>
          <h1 className="mt-3 text-[38px] font-bold leading-none tracking-[-0.04em] md:text-[52px]">
            Оформление заказа
          </h1>
        </div>
        <p className="max-w-[38ch] text-[13px] leading-relaxed text-ink-3 md:text-right">
          Несколько деталей — и заказ отправится прямо на открытую кухню.
        </p>
      </div>
      <div className="mb-7 grid grid-cols-3 gap-2 rounded-[22px] border border-white/70 bg-paper-2/64 p-2 shadow-s backdrop-blur-xl">
        {[
          ["01", "Корзина"],
          ["02", "Детали"],
          ["03", "Готово"],
        ].map(([number, label], index) => (
          <div key={number} className={`rounded-[16px] px-4 py-3 ${index === 1 ? "bg-tint-sakura shadow-s" : ""}`}>
            <span className="block text-[8px] font-bold tracking-[0.16em] text-ink-3">{number}</span>
            <b className="mt-1 block text-[10px] uppercase tracking-[0.09em]">{label}</b>
          </div>
        ))}
      </div>
      <CheckoutForm />
    </main>
  );
}
