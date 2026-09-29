import { KintsugiBowl } from "@/components/KintsugiBowl";
import { GoldHairline } from "@/components/GoldHairline";

/**
 * Общий каркас служебных страниц — 404, ошибка сегмента, ошибка корня.
 * Без хуков и серверных зависимостей, чтобы его мог рендерить и
 * клиентский error.tsx, и серверный not-found.tsx.
 */
export function SystemPage({
  variant,
  eyebrow,
  title,
  description,
  actions,
  footnote,
}: {
  variant: "crack" | "missing";
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  actions: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    // На телефоне заголовок и действие важнее иллюстрации: карточка ниже
    // (16:10 вместо 5:4), а контент прижат к верху, а не центрирован по
    // высоте экрана — иначе кнопка уезжает под нижнюю навигацию.
    <main className="mx-auto grid max-w-wrap items-start px-5 pb-10 pt-6 md:min-h-[calc(100dvh-64px)] md:items-center md:px-16 md:py-16">
      <div className="grid items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14 lg:gap-20">
        <figure className="hero-stagger-1 relative mx-auto w-full max-w-[460px] md:order-2 md:max-w-none">
          <div className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-[28px] border border-hair bg-tint-ivory shadow-s md:aspect-[5/4] md:rounded-[34px]">
            {/* Мягкое пятно света на «столе» — единственный декоративный слой. */}
            <span
              aria-hidden
              className="absolute inset-x-[12%] bottom-[8%] top-[22%] rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold)/.16),transparent)]"
            />
            <KintsugiBowl variant={variant} className="relative w-[64%] max-w-[360px] md:w-[74%]" />
          </div>
          <figcaption className="mt-3 flex items-center gap-3 px-1 text-[11px] leading-snug text-ink-3 md:mt-4">
            <GoldHairline width={28} />
            <span>
              <span className="font-semibold text-ink-2">金継ぎ · кинцуги</span> — трещину
              заливают золотом, а не прячут
            </span>
          </figcaption>
        </figure>

        <div className="md:order-1">
          <p className="hero-stagger-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cherry">
            {eyebrow}
          </p>
          <h1 className="hero-stagger-2 mt-3 max-w-[13ch] text-balance text-[34px] md:mt-4 font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-[46px] lg:text-[56px]">
            {title}
          </h1>
          <div className="hero-stagger-3 mt-5 max-w-[46ch] text-[14.5px] leading-[1.75] text-ink-2">
            {description}
          </div>
          <div className="hero-stagger-3 mt-8 flex flex-wrap gap-3">{actions}</div>
          {footnote ? (
            <p className="hero-stagger-4 mt-8 border-t border-hair pt-4 text-[12px] text-ink-3">
              {footnote}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

// Кнопки служебных страниц: те же пропорции и язык нажатия, что у CTA в Hero.
export const systemPrimaryAction =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-btn px-7 text-[11px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-s transition duration-300 active:scale-95 hover:shadow-m motion-safe:hover:-translate-y-0.5";

export const systemSecondaryAction =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-plum/30 px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-ink transition duration-300 active:scale-95 hover:border-plum hover:bg-paper-2";
