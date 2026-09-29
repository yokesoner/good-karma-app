import { HeroSlider } from "@/components/HeroSlider";
import { getHeroSlides } from "@/server/heroSlides";

// Первый экран — слайдер (/admin/banners/hero). Не зависит от каталога:
// при недоступной базе getHeroSlides отдаёт исходный набор слайдов, и бренд,
// навигация и основное предложение остаются видимыми.
//
// Мобильный и desktop-макет каждого слайда — раздельная разметка (см.
// HeroSlider): на телефоне текст лежит на стеклянной карточке внизу кадра,
// а не на градиенте поверх фото, — контраст не зависит от фотографии.
export async function Hero() {
  const slides = await getHeroSlides();
  return <HeroSlider slides={slides} />;
}
