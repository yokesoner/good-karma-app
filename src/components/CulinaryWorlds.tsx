import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { CulturalAccent } from "@/components/CulturalAccent";

const worlds = [
  {
    href: "/menu/ramen",
    eyebrow: "Азия · 火と静けさ",
    title: "Тихий огонь Азии",
    description: "Рамен на восьмичасовом бульоне, роллы ручной сборки и вок за три минуты.",
    image: ASSETS.backgrounds.heroTwoWorlds,
    imageClass: "object-[68%_center]",
    className: "md:col-span-7",
    tags: ["Роллы", "Рамен", "Вок"],
  },
  {
    href: "/menu/pizza",
    eyebrow: "Европа · forno",
    title: "Тепло знакомых вкусов",
    description: "Тонкое тесто, хорошая моцарелла и выпечка — с нашим вниманием к деталям.",
    image: ASSETS.backgrounds.europeTable,
    imageClass: "object-center",
    className: "md:col-span-5",
    tags: ["Пицца", "Выпечка", "Десерты"],
  },
] as const;

export function CulinaryWorlds() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
      {worlds.map((world, index) => (
        <Link
          key={world.href}
          href={world.href}
          className={`group relative isolate min-h-[360px] overflow-hidden rounded-[30px] border border-hair shadow-s transition duration-500 hover:-translate-y-1 hover:shadow-l md:min-h-[420px] ${world.className}`}
        >
          <Image
            src={world.image}
            alt=""
            aria-hidden
            fill
            sizes={index === 0 ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 768px) 42vw, 100vw"}
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
            world={index === 0 ? "japan" : "europe"}
            className="bottom-[-42px] right-[-22px] z-10 hidden h-[190px] w-[126px] opacity-60 sm:block"
          />

          <div className="relative flex min-h-[360px] flex-col justify-between p-7 text-[#F8F0EA] md:min-h-[420px] md:p-9">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F8F0EA]/75">
                {world.eyebrow}
              </span>
              <span
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/10 text-lg backdrop-blur-sm transition group-hover:translate-x-0.5 group-hover:bg-white/15"
              >
                ↗
              </span>
            </div>

            <div>
              <h3 className="max-w-[12ch] text-[32px] font-bold leading-[1.02] tracking-[-0.035em] md:text-[40px]">
                {world.title}
              </h3>
              <p className="mt-4 max-w-[39ch] text-[13px] font-medium leading-relaxed text-[#F8F0EA]/75">
                {world.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {world.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/20 bg-black/10 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.13em] text-[#F8F0EA]/85 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
