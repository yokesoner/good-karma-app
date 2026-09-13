/**
 * Единая точка управления путями к локальным ассетам.
 * Все компоненты обращаются только сюда — если папка переедет или
 * файлы заменят на финальные рендеры, правится один этот файл.
 *
 * Файлы лежат в /public/assets, поэтому пути начинаются с /assets.
 */
export const ASSETS = {
  mascots: {
    catIdle: "/assets/mascots/cat_idle.png",
    catBowl: "/assets/mascots/cat_bowl.png",
    catPaw: "/assets/mascots/cat_paw.png",
    fox: "/assets/mascots/fox.png",
    rabbit: "/assets/mascots/rabbit.png",
    panda: "/assets/mascots/panda.png",
  },
  decor: {
    sakuraBranch: "/assets/decor/sakura_branch.png",
    sakuraFlower: "/assets/decor/sakura_flower.png",
    sakuraPetals: "/assets/decor/sakura_petals.png",
    hanko: "/assets/decor/hanko_vertical.png",
    enso: "/assets/decor/enso_circle.png",
    fuji: "/assets/decor/fuji_landscape.png",
    seigaihaWave: "/assets/decor/seigaiha_wave.png",
    clouds: "/assets/decor/clouds.png",
    japanLantern: "/assets/decor/japan_lantern_v2.png",
    europeHarvest: "/assets/decor/europe_harvest_v2.png",
  },
  backgrounds: {
    karmaGarden: "/assets/backgrounds/karma_garden_v2.png",
    menuEditorial: "/assets/backgrounds/menu_editorial_v2.png",
    wokSignature: "/assets/backgrounds/wok_signature_v2.png",
    heroTwoWorlds: "/assets/backgrounds/hero_two_worlds.png",
    europeTable: "/assets/backgrounds/europe_table.png",
    openKitchenStory: "/assets/backgrounds/open_kitchen_story.png",
    deliveryRitual: "/assets/backgrounds/delivery_ritual.png",
    sakuraIvory: "/assets/backgrounds/bg_sakura_ivory.png",
    lavenderMist: "/assets/backgrounds/bg_lavender_mist.png",
    mintWashi: "/assets/backgrounds/bg_mint_washi.png",
    plumNight: "/assets/backgrounds/bg_plum_night.png",
    darkPlumPattern: "/assets/backgrounds/dark_plum_pattern.png",
    rollsSakura: "/assets/backgrounds/rolls_sakura.png",
    ramenMint: "/assets/backgrounds/ramen_mint.png",
    drinksLavender: "/assets/backgrounds/drinks_lavender.png",
  },
  animations: {
    sakuraPetals: "/assets/animations/sakura_petals_loop.webp",
    steam: "/assets/animations/steam_loop.webp",
    plumInkMist: "/assets/animations/plum_ink_mist_loop.webp",
    goldParticles: "/assets/animations/gold_particles_loop.webp",
    seigaihaShimmer: "/assets/animations/seigaiha_shimmer_loop.webp",
  },
  // Ключи совпадают с id в WokSauce/WokProtein/WokBase (prisma/schema.prisma),
  // чтобы соус/белок/основу из БД можно было найти в реестре напрямую по id,
  // без отдельной карты соответствий. У bbq и sriracha пока нет изображения —
  // сознательно не заводим для них ключ с плейсхолдером, чтобы TS сразу
  // подсвечивал ASSETS.wok.bbq как несуществующее свойство, а не отдавал
  // undefined втихую.
  wok: {
    udon: "/assets/wok/udon.png",
    funchoza: "/assets/wok/funchoza.png",
    soba: "/assets/wok/soba.png",
    rice: "/assets/wok/rice.png",
    chicken: "/assets/wok/chicken.png",
    pork: "/assets/wok/pork.png",
    beef: "/assets/wok/beef.png",
    shrimp: "/assets/wok/shrimp.png",
    salmon: "/assets/wok/salmon.png",
    teriyaki: "/assets/wok/teriyaki.png",
    oyster: "/assets/wok/oyster.png",
    chili: "/assets/wok/sweet_chili.png",
  },
  pizza: {
    pepperoni: "/assets/pizza/pepperoni.png",
    mozzarella: "/assets/pizza/mozzarella.png",
    cherryTomatoes: "/assets/pizza/cherry_tomatoes.png",
    arugula: "/assets/pizza/arugula.png",
    ham: "/assets/pizza/ham.png",
    bacon: "/assets/pizza/bacon.png",
    chicken: "/assets/pizza/chicken.png",
    tuna: "/assets/pizza/tuna.png",
    mushrooms: "/assets/pizza/mushrooms.png",
    olives: "/assets/pizza/olives.png",
    jalapeno: "/assets/pizza/jalapeno.png",
    redOnion: "/assets/pizza/red_onion.png",
    bellPepper: "/assets/pizza/bell_pepper.png",
    pineapple: "/assets/pizza/pineapple.png",
    parmesan: "/assets/pizza/parmesan.png",
    basil: "/assets/pizza/basil.png",
  },
} as const;
