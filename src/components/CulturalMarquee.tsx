const NOTES = [
  ["火", "живой огонь"],
  ["手仕事", "ручная работа"],
  ["UMAMI", "глубина вкуса"],
  ["FORNO", "тепло печи"],
  ["LIEVITO", "тесто на закваске"],
  ["旬", "сезонные продукты"],
] as const;

export function CulturalMarquee() {
  return (
    <section aria-label="Философия кухни" className="culture-marquee border-y border-hair-soft bg-paper-2/50 py-3.5 backdrop-blur-xl">
      <div className="culture-marquee__track flex w-max items-center">
        {[...NOTES, ...NOTES].map(([mark, label], index) => (
          <span
            key={`${mark}-${index}`}
            aria-hidden={index >= NOTES.length ? true : undefined}
            className="flex items-center gap-3 px-6 md:px-9"
          >
            <b className="text-[11px] font-bold uppercase tracking-[0.18em] text-cherry">{mark}</b>
            <span className="text-micro font-semibold uppercase tracking-[0.17em] text-ink-3">{label}</span>
            <span aria-hidden className="ml-3 h-1 w-1 rounded-full bg-gold" />
          </span>
        ))}
      </div>
    </section>
  );
}
