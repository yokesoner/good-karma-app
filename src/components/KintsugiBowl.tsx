import { cn } from "@/lib/cn";

/**
 * Чаша, починенная золотом, — буквальная версия мотива «Кинцуги-стол»
 * для служебных страниц. Трещину не прячут, а подчёркивают: ровно то,
 * что мы хотим сказать гостю, когда что-то сломалось.
 *
 * Чистый SVG без JS: шов прорисовывается через stroke-dashoffset
 * (pathLength=1 нормирует длину любой кривой к единице), а осколок
 * у варианта "missing" медленно парит. Оба эффекта объявлены только
 * внутри prefers-reduced-motion: no-preference в globals.css — без
 * анимации шов сразу целый, осколок неподвижен.
 */
export function KintsugiBowl({
  variant,
  className,
}: {
  /** crack — трещина залита золотом (сбой); missing — не хватает осколка (404). */
  variant: "crack" | "missing";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 190"
      aria-hidden
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-ink", className)}
    >
      {/* тень под чашей — привязывает предмет к «столу» */}
      <ellipse cx="120" cy="172" rx="62" ry="6" className="fill-plum-deep/10" />

      {/* тело и ножка */}
      <path
        d="M26 70c3 52 44 84 94 84s91-32 94-84"
        className="fill-paper-2"
        stroke="currentColor"
        strokeOpacity=".72"
        strokeWidth="1.6"
      />
      <path
        d="M90 150.5 94 164h52l4-13.5"
        className="fill-paper-3"
        stroke="currentColor"
        strokeOpacity=".72"
        strokeWidth="1.6"
      />

      {variant === "missing" && (
        // Маска вырезает скол из дальней кромки — сквозь выемку виден фон
        // карточки, а не заливка-заплатка, так что скол честный на любом фоне.
        <defs>
          <mask id="kintsugi-notch" maskUnits="userSpaceOnUse">
            <rect width="240" height="190" fill="white" />
            <path d={NOTCH} fill="black" stroke="black" strokeWidth="1.2" />
          </mask>
        </defs>
      )}

      {/* кромка: внутренняя часть темнее — у чаши появляется глубина */}
      <g mask={variant === "missing" ? "url(#kintsugi-notch)" : undefined}>
        <ellipse cx="120" cy="70" rx="94" ry="19" className="fill-paper-3" />
        <ellipse
          cx="120"
          cy="70"
          rx="94"
          ry="19"
          stroke="currentColor"
          strokeOpacity=".72"
          strokeWidth="1.6"
        />
      </g>
      <path
        d="M34 72c10 9 44 15 86 15s76-6 86-15"
        stroke="currentColor"
        strokeOpacity=".16"
        strokeWidth="1.2"
      />

      {/* тонкий орнамент по телу — чаша «из нашей посуды», а не абстрактная */}
      <path
        d="M44 104c24 12 50 17 76 17s52-5 76-17"
        stroke="rgb(var(--cherry))"
        strokeOpacity=".35"
        strokeWidth="1"
        strokeDasharray="1 5"
      />

      {/* золотой шов: основная трещина и ответвление */}
      <g stroke="rgb(var(--gold))" strokeWidth="2.2">
        {variant === "crack" ? (
          <>
            <path
              pathLength={1}
              className="kintsugi-seam"
              d="M108 88.5c1.8 5 5.8 8.4 3.6 14.2-1.9 5 -7.4 7.2-6.1 13.3 1.2 5.6 8 7.9 8.9 13.9.8 5.2-2.7 9.7-1.9 20.6"
            />
            <path
              pathLength={1}
              className="kintsugi-seam kintsugi-seam--late"
              d="M111.6 102.7c6.4 1.4 11.8.4 16.4 4.6 3.9 3.6 3.6 9.6 8.3 12.6"
            />
          </>
        ) : (
          <>
            {/* излом кромки уже «позолочен» — место, куда вернётся осколок */}
            <path d={NOTCH_EDGE} strokeWidth="1.8" />
            <path
              pathLength={1}
              className="kintsugi-seam"
              d="M125 62c-1.6 5.4 2.8 9.2 1.4 14.6-1.2 4.8-6.4 7.4-5.2 12.9 1.1 5.1 7.5 7.4 8.2 13.1.6 5.4-3 9.6-1.6 16.4"
            />
          </>
        )}
      </g>

      {variant === "missing" && (
        // Недостающий осколок — ровно тот же контур, что вырезан маской,
        // приподнятый над чашей: «страница» есть, просто не на своём месте.
        <g className="kintsugi-shard">
          <g transform="translate(0 -26)">
            <path d={NOTCH} className="fill-paper-2" />
            <path
              d="M98 51.5Q120 50.5 142 51.5"
              stroke="currentColor"
              strokeOpacity=".72"
              strokeWidth="1.6"
            />
            <path d={NOTCH_EDGE} stroke="rgb(var(--gold))" strokeWidth="1.8" />
          </g>
        </g>
      )}
    </svg>
  );
}

// Дальняя дуга кромки между x=98 и x=142 лежит на y≈51 (эллипс cx120 cy70
// rx94 ry19), снизу — зубчатый излом. Один контур на выемку и на осколок,
// чтобы они гарантированно совпадали.
const NOTCH_EDGE = "M142 51.5 138 58l-7-2.5-6 6.5-8-5-8 3.5-6-4.5-5-4.5";
const NOTCH = `M98 51.5Q120 50.5 142 51.5L138 58l-7-2.5-6 6.5-8-5-8 3.5-6-4.5Z`;
