// Реестр баннеров сайта, тексты и картинки которых админ может менять на
// /admin/banners. Здесь — единственное место, где описан каждый слот:
// как он называется в админке, какие поля у него редактируются и что
// показывается, пока админ ничего не менял (defaults — это дословно те
// тексты, что раньше были зашиты в компонентах).
//
// Модуль намеренно без обращений к базе — его импортирует и клиентская
// форма в админке. Чтение из БД — в src/server/siteBanners.ts.

export type BannerFieldKey = "eyebrow" | "title" | "text" | "buttonLabel" | "href" | "imageUrl";

export type BannerContent = {
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  href: string;
  // null — рисуем исходную картинку из реестра ассетов (src/lib/assets.ts).
  imageUrl: string | null;
  isActive: boolean;
};

export type BannerSlot = {
  key: string;
  /** Название в списке админки. */
  name: string;
  /** Где именно баннер виден покупателю — чтобы админ понимал, что правит. */
  where: string;
  /** Ссылка на страницу сайта, где его можно увидеть. */
  previewHref: string;
  /** Какие поля можно менять — остальные остаются как в коде. */
  fields: readonly BannerFieldKey[];
  /** Свои подписи полей, если общие («Заголовок», «Текст») не подходят. */
  labels?: Partial<Record<BannerFieldKey, string>>;
  /** Подсказки под полями. */
  hints?: Partial<Record<BannerFieldKey, string>>;
  /** Можно ли скрыть баннер целиком переключателем. */
  toggleable?: boolean;
  defaults: BannerContent;
};

const base: BannerContent = {
  eyebrow: "",
  title: "",
  text: "",
  buttonLabel: "",
  href: "",
  imageUrl: null,
  isActive: true,
};

export const BANNER_SLOTS = [
  {
    key: "announcement",
    name: "Анонс-полоска",
    where: "Тонкая полоска над шапкой на всех страницах сайта",
    previewHref: "/",
    fields: ["text", "buttonLabel", "href"],
    labels: {
      text: "Текст объявления",
      buttonLabel: "Подпись ссылки",
      href: "Куда ведёт (необязательно)",
    },
    hints: {
      text: "Например: «Сегодня доставка бесплатно от 800 ₽» или «11 января кафе закрыто».",
      href: "Путь на сайте (/promotions) или ссылка https://… — если пусто, полоска без ссылки.",
    },
    toggleable: true,
    defaults: { ...base, buttonLabel: "Подробнее", isActive: false },
  },
  {
    key: "home-hero",
    name: "Главный экран",
    where: "Главная страница — самый первый блок с большим заголовком",
    previewHref: "/",
    fields: ["eyebrow", "title", "text", "buttonLabel", "href", "imageUrl"],
    labels: { buttonLabel: "Кнопка", href: "Куда ведёт кнопка", imageUrl: "Фоновая картинка" },
    defaults: {
      ...base,
      eyebrow: "Одно кафе · два мира",
      title: "Азия встречает Европу",
      text: "Роллы, рамен и вок соседствуют с тонким тестом и тёплой выпечкой. Всё готовим на открытой кухне — внимательно, честно и с хорошей кармой.",
      buttonLabel: "Выбрать блюдо",
      href: "/menu",
    },
  },
  {
    key: "home-world-asia",
    name: "Карточка «Азия»",
    where: "Главная — первая из двух больших карточек под главным экраном",
    previewHref: "/",
    fields: ["eyebrow", "title", "text", "href", "imageUrl"],
    labels: { href: "Куда ведёт карточка", imageUrl: "Фон карточки" },
    defaults: {
      ...base,
      eyebrow: "Азия · 火と静けさ",
      title: "Тихий огонь Азии",
      text: "Рамен на восьмичасовом бульоне, роллы ручной сборки и вок за три минуты.",
      href: "/menu/ramen",
    },
  },
  {
    key: "home-world-europe",
    name: "Карточка «Европа»",
    where: "Главная — вторая из двух больших карточек под главным экраном",
    previewHref: "/",
    fields: ["eyebrow", "title", "text", "href", "imageUrl"],
    labels: { href: "Куда ведёт карточка", imageUrl: "Фон карточки" },
    defaults: {
      ...base,
      eyebrow: "Европа · forno",
      title: "Тепло знакомых вкусов",
      text: "Тонкое тесто, хорошая моцарелла и выпечка — с нашим вниманием к деталям.",
      href: "/menu/pizza",
    },
  },
  {
    key: "home-wok",
    name: "Баннер «Конструктор вока»",
    where: "Главная — тёмный баннер с миской вока",
    previewHref: "/",
    fields: ["eyebrow", "title", "text", "buttonLabel", "href", "imageUrl"],
    labels: { buttonLabel: "Кнопка", href: "Куда ведёт кнопка", imageUrl: "Фоновая картинка" },
    defaults: {
      ...base,
      eyebrow: "Конструктор вока · собери свою миску",
      title: "Ваш вок. Ваши правила.",
      text: "Выбираете основу, начинку и соус — мы собираем миску за 3 минуты на открытом огне, сразу после вашего заказа.",
      buttonLabel: "Собрать свой вок",
      href: "/wok-builder",
    },
  },
  {
    key: "home-delivery",
    name: "Баннер «Доставка»",
    where: "Главная — светлый баннер про доставку",
    previewHref: "/",
    fields: ["eyebrow", "title", "text", "buttonLabel", "href", "imageUrl"],
    labels: { buttonLabel: "Кнопка", href: "Куда ведёт кнопка", imageUrl: "Картинка" },
    defaults: {
      ...base,
      eyebrow: "Доставка как ритуал",
      title: "Тепло остаётся внутри",
      text: "Собираем заказ только после подтверждения, бережно упаковываем горячее отдельно от холодного и показываем каждый статус — без выдуманного обратного отсчёта.",
      buttonLabel: "Оформить заказ",
      href: "/checkout",
    },
  },
  {
    key: "menu-hero",
    name: "Шапка страницы «Меню»",
    where: "Страница /menu — заголовок над каталогом",
    previewHref: "/menu",
    fields: ["eyebrow", "title", "text", "imageUrl"],
    labels: { imageUrl: "Фоновая картинка" },
    hints: {
      eyebrow: "{count} автоматически заменится числом блюд в меню.",
    },
    defaults: {
      ...base,
      eyebrow: "Меню · {count} блюд · два мира",
      title: "Вкус, который остаётся",
      text: "От спокойной точности роллов до живого огня вока и европейского тепла печи. Выбирайте настроение — остальное соберём на открытой кухне.",
    },
  },
  {
    key: "menu-wok",
    name: "Карточка «Соберите свой вок»",
    where: "Страница /menu — стеклянная карточка в шапке",
    previewHref: "/menu",
    fields: ["eyebrow", "title", "buttonLabel"],
    labels: { eyebrow: "Надпись сверху", buttonLabel: "Кнопка" },
    defaults: {
      ...base,
      eyebrow: "Noodle Lab",
      title: "Соберите свой вок",
      buttonLabel: "Открыть конструктор",
      href: "/wok-builder",
    },
  },
] as const satisfies readonly BannerSlot[];

export type BannerKey = (typeof BANNER_SLOTS)[number]["key"];

export const BANNER_KEYS = BANNER_SLOTS.map((slot) => slot.key) as unknown as readonly [BannerKey, ...BannerKey[]];

export function getBannerSlot(key: string): BannerSlot | undefined {
  return (BANNER_SLOTS as readonly BannerSlot[]).find((slot) => slot.key === key);
}

type BannerOverride = Partial<Record<BannerFieldKey, string | null>> & { isActive?: boolean };

/** Накладывает то, что сохранил админ, на исходные значения слота. */
export function mergeBanner(slot: BannerSlot, override: BannerOverride | null | undefined): BannerContent {
  const pick = (field: Exclude<BannerFieldKey, "imageUrl">) => {
    const value = override?.[field]?.trim();
    return value ? value : slot.defaults[field];
  };
  return {
    eyebrow: pick("eyebrow"),
    title: pick("title"),
    text: pick("text"),
    buttonLabel: pick("buttonLabel"),
    href: pick("href"),
    imageUrl: override?.imageUrl?.trim() || slot.defaults.imageUrl,
    isActive: slot.toggleable ? (override ? override.isActive ?? slot.defaults.isActive : slot.defaults.isActive) : true,
  };
}
