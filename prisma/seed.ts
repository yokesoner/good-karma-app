import { PrismaClient, Badge } from "@prisma/client";
import seed from "../data/seed.json";
import design from "../data/design-data.json";
import { DEFAULT_HERO_SLIDES, withLegacyHero } from "../src/lib/heroSlides";

const db = new PrismaClient();

// Прототип хранил цену в целых рублях (price: 649), а рейтинг — числом
// с одной цифрой после точки (rating: 4.9). Копейки и Decimal — единственные
// два места, где сид требует конвертации, всё остальное переносится как есть.
const toCents = (rub: number) => Math.round(rub * 100);
const slugify = (name: string, id: number) =>
  `${name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")}-${id}`;

async function main() {
  console.log("Сеем категории и их визуальные миры…");
  for (const [i, cat] of seed.cats.entries()) {
    if (cat.id === "all") continue; // "Все" — фильтр на клиенте, не настоящая категория
    await db.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, sortOrder: i },
      create: { id: cat.id, name: cat.name, sortOrder: i },
    });
    const meta = (design.categoryMeta as Record<string, any>)[cat.id];
    if (meta) {
      const metaData = {
        theme: meta.theme,
        accentTint: meta.accentTint,
        pattern: meta.pattern,
        jpTagline: meta.jp,
        tagline: meta.tag,
      };
      await db.categoryMeta.upsert({
        where: { categoryId: cat.id },
        update: metaData,
        create: { categoryId: cat.id, ...metaData },
      });
    }
  }

  // id из прототипа (числа 1..18) → id новой записи (cuid). Нужна, чтобы
  // потом привязать promotion.dish к настоящему товару.
  const productIdByLegacyId = new Map<number, string>();

  console.log("Сеем товары…");
  for (const p of seed.products) {
    const slug = slugify(p.name, p.id);
    const productData = {
      categoryId: p.cat,
      name: p.name,
      description: p.desc,
      weight: p.weight,
      priceCents: toCents(p.price),
      karma: p.karma,
      badge: p.badge === "hit" ? Badge.HIT : p.badge === "new" ? Badge.NEW : null,
      rating: p.rating,
      ratingCount: 40 + p.id * 11, // прототип генерировал это на клиенте детерминированно от id
    };
    const product = await db.product.upsert({
      where: { slug },
      update: productData,
      create: { slug, ...productData },
    });
    productIdByLegacyId.set(p.id, product.id);

    // Дочерние записи без естественного уникального ключа проще пересоздать
    // с нуля при каждом сиде, чем городить upsert по составному ключу.
    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.create({
      data: { productId: product.id, url: p.img, alt: p.name, sortOrder: 0 },
    });

    await db.productIngredient.deleteMany({ where: { productId: product.id } });
    for (const [i, name] of p.ing.entries()) {
      await db.productIngredient.create({
        data: { productId: product.id, name, sortOrder: i },
      });
    }

    const base = (design.nutritionBaseByCategory as Record<string, any>)[p.cat];
    if (base) {
      const k = 1 + ((p.id % 5) - 2) * 0.04; // тот же разброс ±8%, что и в nutriFor() на клиенте
      const nutritionData = {
        kcal: Math.round(base.kcal * k),
        proteinG: Number((base.proteinG * k).toFixed(1)),
        fatG: Number((base.fatG * k).toFixed(1)),
        carbsG: Number((base.carbsG * k).toFixed(1)),
      };
      await db.nutrition.upsert({
        where: { productId: product.id },
        update: nutritionData,
        create: { productId: product.id, ...nutritionData },
      });
    }
  }

  console.log("Сеем промокоды (без скидки на самовывоз — она отменена)…");
  // Метка и расписание — только при создании: это то, что админ обычно
  // правит под себя, и повторный сид не должен молча откатывать его правки.
  // Расписание HAPPY20 взято из его же описания («каждый будний день с
  // 15:00 до 18:00») — без него «счастливые часы» действовали круглосуточно.
  const promoCreateExtras: Record<string, object> = {
    KARMA15: { label: "Первый заказ", sortOrder: 1 },
    HAPPY20: {
      label: "Счастливые часы",
      sortOrder: 0,
      recurrence: "WEEKLY" as const,
      recurrenceWeekdays: [1, 2, 3, 4, 5],
      recurrenceStartTime: "15:00",
      recurrenceEndTime: "18:00",
    },
  };
  for (const promo of seed.promotions) {
    if (promo.type === "pickup") continue; // PICKUP больше не даёт скидку, оставлять акцией незачем
    const promoData = {
      type: "PERCENT" as const,
      discountPct: promo.off,
      minOrderCents: toCents(promo.min),
      title: promo.title,
      description: promo.text,
      featuredImageProductId: productIdByLegacyId.get(promo.dish) ?? null,
    };
    await db.promotion.upsert({
      where: { code: promo.code },
      update: promoData,
      create: { code: promo.code, ...promoData, ...promoCreateExtras[promo.code] },
    });
  }

  console.log("Сеем добавки к блюдам…");
  // Одна группа добавок на категорию: у пиццы свой набор, у рамена свой.
  // Группа переиспользуется всеми блюдами категории, поэтому связь
  // многие-ко-многим (ProductAddonGroup), а не копия добавок на каждое блюдо.
  const addonByKey = new Map(
    (design.addons as any[]).map((a) => [a.key, a]),
  );
  for (const [categoryId, keys] of Object.entries(
    design.addonSetsByCategory as Record<string, string[]>,
  )) {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) continue;

    const groupName = `Добавки · ${category.name}`;
    const existingGroup = await db.addonGroup.findFirst({ where: { name: groupName } });
    const group =
      existingGroup ?? (await db.addonGroup.create({ data: { name: groupName } }));

    // Пересоздаём состав группы целиком — так сид остаётся идемпотентным
    // и подхватывает изменения цен/набора при каждом запуске.
    await db.addon.deleteMany({ where: { addonGroupId: group.id } });
    for (const [i, key] of keys.entries()) {
      const a = addonByKey.get(key);
      if (!a) continue;
      await db.addon.create({
        data: {
          addonGroupId: group.id,
          name: a.name,
          priceCents: a.priceCents,
          colorHex: a.colorHex,
          sortOrder: i,
        },
      });
    }

    const productsInCategory = await db.product.findMany({
      where: { categoryId },
      select: { id: true },
    });
    for (const p of productsInCategory) {
      await db.productAddonGroup.upsert({
        where: { productId_addonGroupId: { productId: p.id, addonGroupId: group.id } },
        update: {},
        create: { productId: p.id, addonGroupId: group.id },
      });
    }
  }

  console.log("Сеем конструктор вока…");
  for (const b of design.wokBases) {
    await db.wokBase.upsert({
      where: { id: b.id },
      update: { name: b.name, extraCents: b.priceCents },
      create: { id: b.id, name: b.name, extraCents: b.priceCents },
    });
  }
  for (const p of design.wokProteins) {
    await db.wokProtein.upsert({
      where: { id: p.id },
      update: { name: p.name, extraCents: p.priceCents },
      create: { id: p.id, name: p.name, extraCents: p.priceCents },
    });
  }
  for (const s of design.wokSauces) {
    await db.wokSauce.upsert({
      where: { id: s.id },
      update: { name: s.name, extraCents: s.priceCents, colorHex: s.colorHex },
      create: { id: s.id, name: s.name, extraCents: s.priceCents, colorHex: s.colorHex },
    });
  }

  // Товар-носитель для конструктора: скрытый в каталоге, его priceCents —
  // цена «пустой миски» (бульон, овощи, сборка), сверху приценивают
  // extraCents выбранных основы/белка/соуса. Этой сущности не было в
  // прототипе, поэтому не тянем её из seed.json/design-data.json.
  console.log("Сеем товар-носитель для конструктора вока…");
  await db.product.upsert({
    where: { slug: "custom-wok" },
    update: { priceCents: 39000, name: "Вок на заказ" },
    create: {
      slug: "custom-wok",
      categoryId: "wok",
      name: "Вок на заказ",
      description: "Собственная сборка: основа, белок и соус на выбор гостя.",
      weight: "450 г",
      priceCents: 39000,
      karma: 39,
      isHidden: true,
    },
  });

  console.log("Сеем карма-клуб…");
  // Раньше design-data.json задавал только текстовое описание уровня (perk)
  // и товары наград (productIds), но create() ниже никогда не читал
  // productIds — join-таблица karma_reward_products не создавалась вообще.
  // Итог: почти все награды на сайте молча были "Нет товаров — обменять
  // нельзя". Теперь у наград в JSON — productSlugs (человекочитаемые, не
  // id), их резолвим в реальные productId по уже засеянным товарам.
  const productBySlug = new Map((await db.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]));
  const resolveProductSlug = (s: string | undefined) => {
    if (!s) return null;
    const id = productBySlug.get(s);
    if (!id) console.warn(`  ⚠ товар со slug "${s}" не найден — привязка пропущена`);
    return id ?? null;
  };

  for (const lvl of design.karmaLevels as any[]) {
    const { key, ...data } = lvl;
    await db.karmaLevel.upsert({ where: { key }, update: data, create: { key, ...data } });
  }
  await db.karmaReward.deleteMany({});
  for (const reward of design.karmaRewards as any[]) {
    const { productSlugs, ...rest } = reward;
    const productIds = ((productSlugs as string[] | undefined) ?? []).map(resolveProductSlug).filter((id): id is string => Boolean(id));
    await db.karmaReward.create({
      data: { ...rest, products: { create: productIds.map((productId) => ({ productId })) } },
    });
  }

  console.log("Сеем слайды главного экрана (только если их ещё нет)…");
  // Слайды — редакционный контент: после первого запуска ими владеет
  // админ, повторный сид их не трогает. Правки старого баннера-слота
  // «Главный экран» (site_banners, key = home-hero) переносятся в первый слайд.
  if ((await db.heroSlide.count()) === 0) {
    const legacy = await db.siteBanner.findUnique({ where: { key: "home-hero" } });
    for (const [index, slide] of DEFAULT_HERO_SLIDES.entries()) {
      await db.heroSlide.create({
        data: { ...(index === 0 ? withLegacyHero(slide, legacy) : slide), sortOrder: index },
      });
    }
  }

  console.log("Сеем зоны доставки…");
  for (const zone of design.deliveryZones) {
    const { zone: zoneNo, ...rest } = zone;
    await db.deliveryZone.upsert({ where: { zone: zoneNo }, update: rest, create: zone });
  }

  console.log("Готово. Скрипт безопасно перезапускать — данные обновятся, а не задублируются.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
