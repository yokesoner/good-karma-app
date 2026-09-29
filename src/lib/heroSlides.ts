import { ASSETS } from "./assets";

// Слайды главного экрана. Модуль без обращений к базе — его импортируют
// и клиентский слайдер, и форма в админке, и prisma/seed.ts (поэтому
// импорты относительные, без алиаса "@/").

export type HeroSlideContent = {
  id: string;
  tabLabel: string;
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
  secondaryLabel: string | null;
  secondaryHref: string | null;
  /** null — бренд-фотография «Азия встречает Европу». */
  imageUrl: string | null;
};

export const HERO_FALLBACK_IMAGE = ASSETS.backgrounds.heroTwoWorlds;

/** Ограничения полей — общие для формы в админке и серверной проверки. */
export const HERO_SLIDE_LIMITS = {
  tabLabel: 24,
  eyebrow: 60,
  title: 60,
  text: 260,
  buttonLabel: 32,
} as const;

// Исходный набор. Первый слайд — прежний герой сайта. Из его текста убрано
// обещание «открытой кухни»: её в кафе нет, баннер про неё уже заменили
// (см. CLAUDE.md), а первый экран продолжал её обещать.
export const DEFAULT_HERO_SLIDES: Omit<HeroSlideContent, "id">[] = [
  {
    tabLabel: "Два мира",
    eyebrow: "Одно кафе · два мира",
    title: "Азия встречает Европу",
    text: "Роллы, рамен и вок соседствуют с тонким тестом и тёплой выпечкой. Готовим после вашего заказа — честно и с хорошей кармой.",
    buttonLabel: "Выбрать блюдо",
    buttonHref: "/menu",
    secondaryLabel: "Собрать свой вок",
    secondaryHref: "/wok-builder",
    imageUrl: null,
  },
  {
    tabLabel: "Свой вок",
    eyebrow: "Конструктор вока",
    title: "Ваш вок. Ваши правила.",
    text: "Основа, начинка и соус — на ваш выбор. Соберём миску за три минуты на сильном огне, сразу после заказа.",
    buttonLabel: "Собрать вок",
    buttonHref: "/wok-builder",
    secondaryLabel: "Всё меню",
    secondaryHref: "/menu",
    imageUrl: ASSETS.backgrounds.wokSignature,
  },
  {
    tabLabel: "Karma Club",
    eyebrow: "Karma Club · 良いカルマ",
    title: "Хорошее возвращается",
    text: "Каждые 10 ₽ заказа — балл кармы. Баллы поднимают уровень и открывают подарки от кухни: от напитка до любимого ролла.",
    buttonLabel: "Путь подарков",
    buttonHref: "/promotions#karma-club",
    secondaryLabel: "Моя карта",
    secondaryHref: "/profile",
    imageUrl: ASSETS.backgrounds.karmaGarden,
  },
];

/** Правки старого баннера-слота «Главный экран», если админ их делал до слайдера. */
export type LegacyHeroBanner = {
  eyebrow: string | null;
  title: string | null;
  text: string | null;
  buttonLabel: string | null;
  href: string | null;
  imageUrl: string | null;
};

/** Первый слайд по умолчанию с наложенными правками старого баннера. */
export function withLegacyHero(slide: Omit<HeroSlideContent, "id">, legacy: LegacyHeroBanner | null) {
  if (!legacy) return slide;
  const pick = (value: string | null, fallback: string) => value?.trim() || fallback;
  return {
    ...slide,
    eyebrow: pick(legacy.eyebrow, slide.eyebrow),
    title: pick(legacy.title, slide.title),
    text: pick(legacy.text, slide.text),
    buttonLabel: pick(legacy.buttonLabel, slide.buttonLabel),
    buttonHref: pick(legacy.href, slide.buttonHref),
    imageUrl: legacy.imageUrl?.trim() || slide.imageUrl,
  };
}
