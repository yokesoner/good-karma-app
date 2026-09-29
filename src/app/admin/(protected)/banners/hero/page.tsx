import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { AdminHeroSlideMove, AdminHeroSlideRestore } from "@/components/admin/AdminHeroSlideControls";
import { ArrowLeft } from "@/components/icons";
import { db } from "@/lib/db";
import { HERO_FALLBACK_IMAGE } from "@/lib/heroSlides";
import { deleteHeroSlide } from "@/server/adminHeroSlides";

export const metadata: Metadata = { title: "Главный экран — админка Гуд Карма" };

// Слайды главного экрана: порядок, показ/скрытие, правка. Пустой список —
// не пустая главная: сайт показывает исходный набор из кода, о чём здесь
// и сказано, чтобы админ не решил, что главный экран сломан.
export default async function AdminHeroSlidesPage() {
  const slides = await db.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "asc" }] });
  const activeCount = slides.filter((slide) => slide.isActive).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/banners" className="inline-flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Баннеры
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight md:text-4xl">Главный экран</h1>
          <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
            Слайды первого экрана главной. Листаются сами каждые 7,5 секунды, гость может переключать их вкладками.
          </p>
        </div>
        <Link href="/admin/banners/hero/new" className="min-h-11 rounded-full bg-plum-deep px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">
          Добавить слайд
        </Link>
      </div>

      {slides.length > 0 && activeCount === 0 && (
        <p className="mt-5 rounded-2xl bg-tint-gold px-4 py-3 text-[13px] text-ink">
          Все слайды скрыты — сейчас на главной исходный набор слайдов из кода. Включите хотя бы один свой.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {slides.map((slide, index) => (
          <article key={slide.id} className="flex items-center gap-4 rounded-[22px] border border-hair bg-paper-2 p-3 pr-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- миниатюра произвольного URL в админке */}
            <img src={slide.imageUrl ?? HERO_FALLBACK_IMAGE} alt="" className="h-16 w-24 shrink-0 rounded-2xl border border-hair object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-micro font-bold tabular-nums text-ink-3">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="truncate text-[15px] font-bold">{slide.title}</h2>
                {!slide.isActive && (
                  <span className="rounded-full bg-paper-3 px-2 py-0.5 text-micro font-bold uppercase tracking-[0.08em] text-ink-3">скрыт</span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[12px] text-ink-3">
                Вкладка «{slide.tabLabel}» · {slide.buttonLabel} → {slide.buttonHref}
              </p>
            </div>
            <AdminHeroSlideMove id={slide.id} isFirst={index === 0} isLast={index === slides.length - 1} />
            <Link href={`/admin/banners/hero/${slide.id}`} className="text-micro font-bold uppercase tracking-[0.1em] text-plum hover:underline">
              Изменить
            </Link>
            <AdminDeleteButton identifier={slide.id} label={slide.title} action={deleteHeroSlide} />
          </article>
        ))}

        {slides.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-gold/40 bg-paper-2/60 p-6">
            <p className="text-[15px] font-semibold">Своих слайдов пока нет</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
              Сейчас на главной исходный набор из трёх слайдов. Добавьте его сюда, чтобы править, или создайте свой.
            </p>
            <div className="mt-4">
              <AdminHeroSlideRestore />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
