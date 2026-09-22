import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { CulturalAccent } from "@/components/CulturalAccent";
import { ArrowUpRight } from "@/components/icons";
import { getBanner } from "@/server/siteBanners";

// Тексты, ссылка и фон карточек — баннеры «Азия» и «Европа» из админки
// (/admin/banners). Здесь остаётся только то, что привязано к вёрстке:
// кадрирование, теги и декоративный акцент.
const worlds = [
  {
    key: "home-world-asia",
    fallbackImage: ASSETS.backgrounds.japanTable,
    imageClass: "object-[62%_center]",
    className: "md:col-span-7",
    accent: "japan",
    tags: ["Роллы", "Рамен", "Вок"],
  },
  {
    key: "home-world-europe",
    fallbackImage: ASSETS.backgrounds.europeTable,
    imageClass: "object-center",
    className: "md:col-span-5",
    accent: "europe",
    tags: ["Пицца", "Выпечка", "Десерты"],
  },
] as const;

// На телефоне две большие карточки друг под другом занимали два экрана —
// теперь это горизонтальная лента с «прилипанием» (вторая карточка
// выглядывает справа и подсказывает, что можно листать), на планшете и
// десктопе — прежняя сетка.
export async function CulinaryWorlds() {
  const banners = await Promise.all(worlds.map((world) => getBanner(world.key)));

  return (
    <div className="snap-row -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-12 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
      {worlds.map((world, index) => {
        const banner = banners[index]!;
        return (
          <Link
            key={world.key}
            href={banner.href}
            data-reveal
            style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
            className={`group relative isolate min-h-[250px] w-[80vw] max-w-[380px] shrink-0 overflow-hidden rounded-[24px] border border-hair shadow-s transition duration-500 active:scale-[0.985] hover:-translate-y-1 hover:shadow-l md:min-h-[420px] md:w-auto md:max-w-none md:rounded-[30px] ${world.className}`}
          >
            <Image
              src={banner.imageUrl ?? world.fallbackImage}
              alt=""
              aria-hidden
              fill
              sizes={index === 0 ? "(min-width: 768px) 58vw, 80vw" : "(min-width: 768px) 42vw, 80vw"}
              className={`object-cover transition duration-700 ease-out group-hover:scale-[1.035] ${world.imageClass}`}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-plum-deep/95 via-plum-deep/35 to-transparent"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-plum-deep/35 via-transparent to-transparent"
            />
            <CulturalAccent
              world={world.accent}
              className="bottom-[-42px] right-[-22px] z-10 hidden h-[190px] w-[126px] opacity-60 sm:block"
            />

            <div className="relative flex min-h-[250px] flex-col justify-between p-5 text-[#F8F0EA] md:min-h-[420px] md:p-9">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#F8F0EA]/75 md:text-[10px] md:tracking-[0.2em]">
                  {banner.eyebrow}
                </span>
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-black/10 text-[15px] backdrop-blur-sm transition group-hover:translate-x-0.5 group-hover:bg-white/15 md:h-10 md:w-10 md:text-[17px]"
                >
                  <ArrowUpRight />
                </span>
              </div>

              <div>
                <h3 className="max-w-[12ch] text-[25px] font-bold leading-[1.04] tracking-[-0.035em] md:text-[40px] md:leading-[1.02]">
                  {banner.title}
                </h3>
                <p className="mt-2.5 line-clamp-3 max-w-[39ch] text-[12.5px] font-medium leading-relaxed text-[#F8F0EA]/75 md:mt-4 md:line-clamp-none md:text-[13px]">
                  {banner.text}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5 md:mt-6 md:gap-2">
                  {world.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/20 bg-black/10 px-3 py-1.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#F8F0EA]/85 backdrop-blur-sm md:px-3.5 md:py-2 md:text-[9px] md:tracking-[0.13em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
