import Image from "next/image";
import { Collapsible } from "@/components/Collapsible";
import { PromoCodeButton } from "@/components/PromoCodeButton";
import { PromoStamp } from "@/components/PromoStamp";
import { PromoTimingChip } from "@/components/PromoTimingChip";
import { TicketTilt } from "@/components/TicketTilt";
import { cn } from "@/lib/cn";
import type { StorefrontPromo } from "@/server/storefrontPromotions";

/**
 * Акция как отрывной талон — язык купонов сетевых ресторанов, но в своей
 * системе: линия отрыва — это золотой шов «Кинцуги», а вырезы по краям
 * шва сделаны маской, поэтому сквозь них виден настоящий фон страницы.
 *
 * Слева (на телефоне — сверху) — «лицо» акции: фото и размер скидки.
 * Справа — корешок: когда действует, условия и сам код. Полные условия
 * раскрываются по месту, без перехода на отдельную страницу.
 *
 * Движение (globals.css, раздел «Талон акции»): при появлении лицо и
 * корешок съезжаются к шву, шов прорисовывается золотом, цифра скидки
 * выезжает из-под маски; при наведении — наклон за курсором с бликом
 * (TicketTilt); когда код применён, пунктир становится сплошным швом —
 * талон «починен золотом».
 */
export function PromoTicket({ promo, index }: { promo: StorefrontPromo; index: number }) {
  const onPhoto = Boolean(promo.image);
  const live = promo.timing.state === "live";
  const terms = [
    promo.minOrder,
    promo.schedule && `Действует ${promo.schedule}`,
    "Один раз на номер телефона",
    "Не суммируется с другими скидками и скидкой уровня Karma Club",
    "Баллы Karma Club за заказ начисляются как обычно",
  ].filter((term): term is string => Boolean(term));

  return (
    <div
      id={`promo-${promo.code}`}
      data-reveal="ticket"
      style={{ ["--reveal-delay" as string]: `${Math.min(index, 4) * 90}ms` }}
      // Тень рисуем фильтром на обёртке: box-shadow самой карточки срезала
      // бы маска вместе с вырезами, а drop-shadow повторяет их форму.
      className="promo-ticket-wrap scroll-mt-28"
    >
      <TicketTilt>
        <article className="promo-ticket group relative grid overflow-hidden rounded-[26px] bg-paper-2 sm:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] sm:rounded-[30px]">
          {/* ── лицо талона ── */}
          <div
            className={cn(
              "promo-ticket__face relative isolate flex h-[200px] flex-col justify-between overflow-hidden p-5 sm:h-auto sm:min-h-[320px] sm:p-7",
              onPhoto ? "bg-[#24161F] text-[#FFF8F2]" : cn("bg-gradient-to-br text-[#3A2338]", promo.background),
            )}
          >
            {promo.image ? (
              <>
                <Image
                  src={promo.image.url}
                  alt={promo.image.alt}
                  fill
                  sizes="(min-width: 1280px) 26vw, (min-width: 640px) 45vw, 100vw"
                  className="promo-ticket__photo object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1B1119]/90 via-[#1B1119]/35 to-[#1B1119]/10" />
              </>
            ) : (
              <div aria-hidden className="promo-rings absolute -right-14 -top-14 h-52 w-52 opacity-55" />
            )}

            {/* Метка на лице — только когда у акции есть своё название: иначе
                метка сама становится заголовком корешка и повторялась бы дважды. */}
            {promo.label && promo.headline ? (
              <span
                className={cn(
                  "relative w-fit rounded-full px-3 py-1.5 text-micro font-bold uppercase tracking-[0.14em]",
                  onPhoto ? "bg-[#FFF8F2] text-[#3A2338]" : "bg-[#3A2338] text-[#FFF8F2]",
                )}
              >
                {promo.label}
              </span>
            ) : (
              <span aria-hidden />
            )}
            {/* Маска строки: цифра при появлении выезжает снизу из-под неё.
                Размер цифры — от ширины самого талона (container query):
                «−300 ₽» длиннее «−20%», а талон в одну и в две колонки разный. */}
            <div className="relative overflow-hidden pb-[0.06em]">
              <div
                className="promo-ticket__discount font-extrabold leading-[0.9] tracking-[-0.06em]"
                data-long={promo.discount.length > 4 || undefined}
              >
                {promo.discount}
              </div>
            </div>
          </div>

          {/* ── линия отрыва: золотой шов ── */}
          <span aria-hidden className="promo-ticket__seam pointer-events-none absolute z-10" />

          {/* ── корешок ── */}
          <div className="promo-ticket__stub relative flex min-w-0 flex-col p-5 sm:p-7">
            <PromoTimingChip timing={promo.timing} className="w-fit" />
            <h3 className="mt-4 line-clamp-2 text-[20px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[22px]">
              {promo.headline ?? promo.label ?? `Скидка ${promo.discount}`}
            </h3>
            <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-2">{promo.description}</p>

            <div className="mt-auto pt-5">
              <div className="flex flex-wrap items-center gap-3">
                {live ? (
                  <PromoCodeButton code={promo.code} />
                ) : (
                  <span className="inline-flex min-h-12 items-center rounded-full border border-dashed border-plum/35 px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-2">
                    Код {promo.code}
                  </span>
                )}
              </div>

              <Collapsible
                className="mt-4 border-t border-hair pt-2"
                summary={<span className="text-[12.5px] font-semibold text-ink-2">Условия акции</span>}
              >
                <ul className="space-y-1.5 pb-1 pt-1 text-[12.5px] leading-snug text-ink-2">
                  {terms.map((term) => (
                    <li key={term} className="flex gap-2.5">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {term}
                    </li>
                  ))}
                </ul>
              </Collapsible>
            </div>

            <PromoStamp code={promo.code} className="right-4 top-4 sm:right-6 sm:top-6" />
          </div>

          {/* Блик за курсором (TicketTilt пишет --gx/--gy). */}
          <span aria-hidden className="promo-ticket__glare pointer-events-none absolute inset-0 z-20" />
        </article>
      </TicketTilt>
    </div>
  );
}
