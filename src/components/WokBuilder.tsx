"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { WokBase, WokProtein, WokSauce } from "@prisma/client";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { calculateWokPriceCents } from "@/lib/wok";
import { ASSETS } from "@/lib/assets";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { cn } from "@/lib/cn";

type Props = {
  productId: string;
  productName: string;
  basePriceCents: number;
  bases: WokBase[];
  proteins: WokProtein[];
  sauces: WokSauce[];
};

const STEPS = ["Основа", "Белок", "Соус"] as const;
const STEP_COPY = [
  {
    eyebrow: "Текстура",
    title: "С чего начнём?",
    description: "Выберите основу — она задаст плотность, упругость и настроение всей миски.",
  },
  {
    eyebrow: "Насыщенность",
    title: "Добавьте характер",
    description: "Нежная курица, сочная говядина, креветки или лосось — порция уже рассчитана шефом.",
  },
  {
    eyebrow: "Финальный акцент",
    title: "Соберите вкус",
    description: "От мягкого терияки до яркой шрирачи. Соус свяжет все ингредиенты воедино.",
  },
] as const;

const OPTION_TONES: Record<string, [string, string]> = {
  udon: ["#EFCB91", "#FFF2D8"],
  funchoza: ["#D8CAB4", "#F7F0E5"],
  soba: ["#A9835D", "#E8D5B8"],
  rice: ["#DAD5C9", "#FFFDF8"],
  chicken: ["#D89C65", "#F7D4A4"],
  pork: ["#C98272", "#F1B5A6"],
  beef: ["#895446", "#C88A72"],
  shrimp: ["#E47F6D", "#FFC0A8"],
  salmon: ["#E77E67", "#FFB49A"],
  teriyaki: ["#69432A", "#B57A43"],
  bbq: ["#67342D", "#A85A48"],
  oyster: ["#4B382D", "#8A674E"],
  chili: ["#A83F2B", "#EA7750"],
  sriracha: ["#8D261E", "#D94635"],
};

const priceDelta = (extraCents: number) =>
  extraCents === 0 ? "включено" : `+${formatMoney(extraCents)}`;

function FlavorGlyph({ kind, className = "h-8 w-8" }: { kind: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {kind === 0 ? (
        <>
          <path d="M8 13c5 5 19 5 24 0M7 18c6 5 20 5 26 0M9 23c5 4 17 5 22 0" />
          <path d="M12 27c5 3 11 3 16 0" />
        </>
      ) : kind === 1 ? (
        <>
          <path d="M20 5c2 6 8 8 8 16a8 8 0 0 1-16 0c0-5 3-9 7-13" />
          <path d="M20 18c2 2 4 4 3 7a4 4 0 0 1-7-2c0-2 1-4 4-5Z" />
        </>
      ) : (
        <path d="M20 5S9 18 9 25a11 11 0 0 0 22 0C31 18 20 5 20 5Z" />
      )}
    </svg>
  );
}

export function WokBuilder({
  productId,
  productName,
  basePriceCents,
  bases,
  proteins,
  sauces,
}: Props) {
  const [step, setStep] = useState(0);
  const [baseId, setBaseId] = useState(bases[0]!.id);
  const [proteinId, setProteinId] = useState(proteins[0]!.id);
  const [sauceId, setSauceId] = useState(sauces[0]!.id);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const add = useCart((state) => state.add);

  const base = bases.find((item) => item.id === baseId)!;
  const protein = proteins.find((item) => item.id === proteinId)!;
  const sauce = sauces.find((item) => item.id === sauceId)!;
  const unitPriceCents = useMemo(
    () => calculateWokPriceCents(basePriceCents, base, protein, sauce),
    [basePriceCents, base, protein, sauce],
  );

  const options =
    step === 0
      ? bases.map((item) => ({ ...item, colorHex: null as string | null }))
      : step === 1
        ? proteins.map((item) => ({ ...item, colorHex: null as string | null }))
        : sauces;
  const selectedId = step === 0 ? baseId : step === 1 ? proteinId : sauceId;
  const currentStep = STEP_COPY[step]!;
  const sauceTone = OPTION_TONES[sauce.id]?.[0] ?? sauce.colorHex ?? "#9A536E";

  const selectOption = (id: string) => {
    if (step === 0) setBaseId(id);
    else if (step === 1) setProteinId(id);
    else setSauceId(id);
  };

  const handleAdd = () => {
    add(
      {
        productId,
        name: `${productName}: ${base.name}, ${protein.name}, ${sauce.name}`,
        imageUrl: ASSETS.backgrounds.wokSignature,
        unitPriceCents,
        addons: [],
        wokConfig: {
          baseId: base.id,
          baseName: base.name,
          proteinId: protein.id,
          proteinName: protein.name,
          sauceId: sauce.id,
          sauceName: sauce.name,
        },
      },
      qty,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <>
      {/* ── МОБИЛЬНАЯ ВЕРСИЯ (< md) ───────────────────────────────
          Большая статичная тарелка на телефоне только отнимает экран у
          выбора (она всё равно не меняется от состава, см. компактный
          бейдж ниже), поэтому вместо неё — закреплённые сверху бейдж
          состава и табы шагов, и закреплённая снизу панель вместо
          MobileNav (см. SiteShell.tsx: на этом роуте она скрыта, иначе
          на телефоне было бы два ряда контролов внизу одновременно). */}
      <div className="md:hidden">
        <div className="sticky top-16 z-20 -mx-5 bg-paper/95 px-5 pb-3 pt-2 backdrop-blur-xl">
          <div className="flex items-center gap-3 py-2">
            <div className="relative h-14 w-14 flex-none overflow-hidden rounded-full border border-white/70 shadow-s">
              <Image
                src={ASSETS.backgrounds.wokSignature}
                alt=""
                aria-hidden
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              <span
                key={baseId}
                className="wok-value-in inline-flex max-w-full items-center truncate rounded-full border border-hair bg-paper-2/70 px-2.5 py-1 text-[9.5px] font-semibold text-ink-2"
              >
                {base.name}
              </span>
              <span
                key={proteinId}
                className="wok-value-in inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-hair bg-paper-2/70 px-2.5 py-1 text-[9.5px] font-semibold text-ink-2"
              >
                <span
                  className="grid h-3.5 w-3.5 flex-none place-items-center rounded-full text-white"
                  style={{ background: OPTION_TONES[protein.id]?.[0] ?? "#9A536E" }}
                >
                  <FlavorGlyph kind={1} className="h-2 w-2" />
                </span>
                {protein.name}
              </span>
              <span
                key={sauceId}
                className="wok-value-in inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-hair bg-paper-2/70 px-2.5 py-1 text-[9.5px] font-semibold text-ink-2"
              >
                <span
                  className="grid h-3.5 w-3.5 flex-none place-items-center rounded-full text-white"
                  style={{ background: sauceTone }}
                >
                  <FlavorGlyph kind={2} className="h-2 w-2" />
                </span>
                {sauce.name}
              </span>
            </div>
            <div className="relative h-8 flex-none overflow-hidden text-right">
              <span key={unitPriceCents} className="wok-value-in block whitespace-nowrap text-[16px] font-bold tracking-[-0.02em]">
                {formatMoney(unitPriceCents)}
              </span>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-1.5 pt-1">
            <div
              aria-hidden
              className="absolute inset-y-1 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-[12px] bg-[#3A2338] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ transform: `translateX(${step * 100}%)` }}
            />
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                aria-pressed={index === step}
                className={cn(
                  "relative z-10 min-h-11 rounded-[12px] px-2 text-center text-[9.5px] font-bold uppercase tracking-[0.06em] transition-colors",
                  index === step ? "text-[#FFF8F2]" : "text-ink-3",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div key={step} className="builder-step-enter pb-4 pt-5">
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-cherry">{currentStep.eyebrow}</span>
          <h2 className="mt-2 text-[22px] font-bold leading-[1.1] tracking-[-0.03em]">{currentStep.title}</h2>
          <p className="mt-2 text-[12px] leading-[1.6] text-ink-2">{currentStep.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pb-28">
          {options.map((option) => {
            const selected = option.id === selectedId;
            const [tone, pale] = OPTION_TONES[option.id] ?? [option.colorHex ?? "#9A536E", "#F2E6EA"];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(option.id)}
                aria-pressed={selected}
                className={cn(
                  "relative min-h-[132px] overflow-hidden rounded-[18px] border p-3 text-left transition duration-300",
                  step === 0 && "min-h-[164px]",
                  selected ? "border-transparent ring-1 ring-cherry/30 wok-card-pick" : "border-hair bg-paper/55",
                )}
                style={selected ? { background: `linear-gradient(145deg, ${pale}, #FFFDF8)` } : undefined}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-[12px] text-white shadow-s"
                  style={{ background: `linear-gradient(145deg, ${tone}, ${pale})` }}
                >
                  <FlavorGlyph kind={step} className="h-4 w-4" />
                </span>
                <span className="mt-3 line-clamp-2 block min-h-[26px] text-[10.5px] font-bold leading-[1.25]">
                  {option.name}
                </span>
                <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.08em] text-cherry">
                  {priceDelta(option.extraCents)}
                </span>
                {selected ? (
                  <span className="wok-check-pop absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-[#3A2338] text-[9px] text-white">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-paper/94 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_48px_-28px_rgba(35,20,32,.5)] backdrop-blur-2xl">
          {justAdded ? (
            <div
              role="status"
              className="wok-toast-in pointer-events-none absolute inset-x-4 bottom-[calc(100%+10px)] rounded-[14px] bg-[#3A2338] px-4 py-2.5 text-center text-[11px] font-semibold text-[#FFF8F2] shadow-m"
            >
              Вок ждёт в корзине ·{" "}
              <Link href="/checkout" className="pointer-events-auto underline underline-offset-2">
                оформить →
              </Link>
            </div>
          ) : null}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-none">
              <span className="block text-[7px] font-bold uppercase tracking-[0.14em] text-ink-3">Итого</span>
              <span key={unitPriceCents * qty} className="wok-value-in block text-[15px] font-bold tracking-[-0.02em]">
                {formatMoney(unitPriceCents * qty)}
              </span>
            </div>
            <div className="flex items-center rounded-full border border-hair bg-paper/70 p-0.5">
              <button type="button" aria-label="Уменьшить количество" onClick={() => setQty((v) => Math.max(1, v - 1))} className="grid h-9 w-9 place-items-center rounded-full text-[#765F6E]">
                −
              </button>
              <span className="min-w-6 text-center text-[12px] font-bold">{qty}</span>
              <button type="button" aria-label="Увеличить количество" onClick={() => setQty((v) => v + 1)} className="grid h-9 w-9 place-items-center rounded-full text-[#765F6E]">
                +
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className={cn(
                "flex h-11 flex-1 items-center justify-center rounded-full px-4 text-[10px] font-bold uppercase tracking-[0.06em] text-[#FFF8F2] transition-colors duration-200",
                justAdded ? "bg-mint-deep" : "bg-[#3A2338]",
              )}
            >
              {justAdded ? "Добавлено ✓" : "В корзину"}
            </button>
          </div>
        </div>
      </div>

      {/* ── ДЕСКТОП И ПЛАНШЕТ (≥ md) — без изменений в логике ────── */}
      <div className="hidden grid-cols-1 items-start gap-7 md:grid lg:grid-cols-[1.08fr_0.92fr] lg:gap-9">
      <section className="wok-stage relative isolate overflow-hidden rounded-[38px] border border-white/65 bg-[#F7F1E8] shadow-[0_38px_100px_-48px_rgba(69,38,54,.62)] lg:sticky lg:top-24">
        <div
          aria-hidden
          className="wok-heat absolute inset-0 opacity-65 transition-colors duration-700"
          style={{ background: `radial-gradient(circle at 66% 46%, ${sauceTone}35, transparent 42%)` }}
        />
        <BackgroundFootage src={ASSETS.animations.steam} opacity={0.18} priority />

        <div className="relative flex items-start justify-between gap-5 px-6 pb-2 pt-7 md:px-9 md:pt-9">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#9A536E]">
              Ваша авторская миска
            </span>
            <h2 className="mt-2 text-[25px] font-bold leading-none tracking-[-0.035em] text-[#3A2935] md:text-[31px]">
              Уже хочется попробовать
            </h2>
          </div>
          <span className="rounded-full border border-[#493044]/10 bg-white/55 px-3 py-2 text-[9px] font-bold tracking-[0.15em] text-[#76636F] shadow-s backdrop-blur-md">
            0{step + 1} / 03
          </span>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[660px] overflow-hidden">
          <div aria-hidden className="absolute inset-[12%] rounded-full bg-white/45 blur-2xl" />
          <div
            key={`${baseId}-${proteinId}-${sauceId}`}
            className="wok-dish-swap absolute inset-[3%] overflow-hidden rounded-full drop-shadow-[0_32px_36px_rgba(65,34,45,.28)]"
          >
            <Image
              src={ASSETS.backgrounds.wokSignature}
              alt={`Вок: ${base.name}, ${protein.name}, соус ${sauce.name}`}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="scale-[1.02] object-cover"
            />
          </div>
          <div className="pointer-events-none absolute bottom-[7%] left-1/2 flex -translate-x-1/2 gap-2">
            {[base.name, protein.name, sauce.name].map((value, index) => (
              <span
                key={value}
                className="whitespace-nowrap rounded-full border border-white/70 bg-white/62 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.1em] text-[#4A3542] shadow-[0_12px_28px_-18px_rgba(58,35,56,.6)] backdrop-blur-xl"
              >
                {index + 1}. {value}
              </span>
            ))}
          </div>
        </div>

        <div className="relative grid grid-cols-[1fr_auto] items-center gap-5 border-t border-[#493044]/8 bg-white/40 px-6 py-5 backdrop-blur-xl md:px-9">
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-[#8A7783]">Ваш вок</span>
            <b className="mt-1 block text-[25px] tracking-[-0.04em] text-[#3A2935]">{formatMoney(unitPriceCents)}</b>
          </div>
          <div className="flex items-center rounded-full border border-[#493044]/10 bg-white/60 p-1 shadow-s">
            <button type="button" aria-label="Уменьшить количество" onClick={() => setQty((value) => Math.max(1, value - 1))} className="grid h-9 w-9 place-items-center rounded-full text-[#765F6E] transition hover:bg-[#F2E4E8]">−</button>
            <span className="min-w-7 text-center text-[13px] font-bold text-[#3A2935]">{qty}</span>
            <button type="button" aria-label="Увеличить количество" onClick={() => setQty((value) => value + 1)} className="grid h-9 w-9 place-items-center rounded-full text-[#765F6E] transition hover:bg-[#F2E4E8]">+</button>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/70 bg-paper-2/90 p-5 shadow-[0_28px_76px_-48px_rgba(73,48,68,.62)] backdrop-blur-xl md:p-8">
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "relative rounded-[18px] border px-3 py-3 text-left transition duration-300",
                index === step
                  ? "border-transparent bg-[#3A2338] text-[#FFF8F2] shadow-[0_14px_28px_-18px_rgba(58,35,56,.72)]"
                  : "border-hair bg-paper/55 text-ink-3 hover:-translate-y-0.5 hover:border-cherry/25 hover:bg-paper",
              )}
            >
              <span className="block text-[8px] font-bold uppercase tracking-[0.16em] opacity-55">0{index + 1}</span>
              <span className="mt-1 block text-[10px] font-bold md:text-[11px]">{label}</span>
              {index === step ? <span aria-hidden className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[#E7B0C0]" /> : null}
            </button>
          ))}
        </div>

        <div key={step} className="builder-step-enter mb-6 mt-8">
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-cherry">{currentStep.eyebrow}</span>
          <h3 className="mt-2 text-[27px] font-bold leading-[1.05] tracking-[-0.035em] md:text-[34px]">{currentStep.title}</h3>
          <p className="mt-3 max-w-[48ch] text-[12.5px] leading-[1.7] text-ink-2">{currentStep.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {options.map((option) => {
            const selected = option.id === selectedId;
            const [tone, pale] = OPTION_TONES[option.id] ?? [option.colorHex ?? "#9A536E", "#F2E6EA"];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(option.id)}
                aria-pressed={selected}
                className={cn(
                  "group/option relative min-h-[150px] overflow-hidden rounded-[23px] border p-4 text-left transition duration-300",
                  selected
                    ? "-translate-y-1 border-transparent shadow-[0_22px_40px_-26px_rgba(73,48,68,.58)] ring-1 ring-cherry/25"
                    : "border-hair bg-paper/55 hover:-translate-y-1 hover:border-transparent hover:shadow-m",
                )}
                style={selected ? { background: `linear-gradient(145deg, ${pale}, #FFFDF8)` } : undefined}
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-[17px] text-white shadow-[0_12px_24px_-14px_rgba(38,22,31,.7)] transition duration-500 group-hover/option:rotate-[-4deg] group-hover/option:scale-105"
                  style={{ background: `linear-gradient(145deg, ${tone}, ${pale})` }}
                >
                  <FlavorGlyph kind={step} />
                </span>
                <span className="mt-5 block text-[12px] font-bold leading-tight">{option.name}</span>
                <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.1em] text-cherry">{priceDelta(option.extraCents)}</span>
                {selected ? (
                  <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#3A2338] text-[10px] text-white shadow-s">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-2 border-t border-hair pt-6">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((value) => value - 1)} className="rounded-full border border-hair px-5 py-4 text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-2 transition hover:bg-paper">Назад</button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((value) => value + 1)} className="flex-1 rounded-full bg-[#3A2338] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.11em] text-[#FFF8F2] shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition hover:-translate-y-0.5 hover:bg-[#533649]">Далее · {STEPS[step + 1]}</button>
          ) : (
            <button type="button" onClick={handleAdd} className="flex-1 rounded-full bg-[#3A2338] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.11em] text-[#FFF8F2] shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition hover:-translate-y-0.5 hover:bg-[#533649]">{justAdded ? "Добавлено ✓" : `В корзину · ${formatMoney(unitPriceCents * qty)}`}</button>
          )}
        </div>

        <div aria-live="polite">
          {justAdded ? (
            <p className="mt-4 text-right text-[11px] text-ink-3">
              Вок ждёт в корзине · <Link href="/checkout" className="font-semibold text-cherry hover:underline">оформить заказ →</Link>
            </p>
          ) : null}
        </div>
      </section>
      </div>
    </>
  );
}
