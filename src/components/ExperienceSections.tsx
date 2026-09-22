import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { CulturalAccent } from "@/components/CulturalAccent";
import { GoldHairline } from "@/components/GoldHairline";
import { ArrowUpRight } from "@/components/icons";
import { getBanner } from "@/server/siteBanners";

// Два больших баннера на главной — «Конструктор вока» и «Доставка».
// Тексты, кнопки, ссылки и картинки берутся из /admin/banners; здесь
// остаётся вёрстка и то, что не имеет смысла править (цифры «3 шага»,
// плашки). На телефоне блоки компактнее — раньше каждый занимал больше
// экрана по высоте.
export async function ExperienceSections() {
  const [wok, delivery] = await Promise.all([getBanner("home-wok"), getBanner("home-delivery")]);

  return (
    <div className="mx-auto max-w-wrap px-5 py-4 md:px-16 md:py-14">
      <section
        data-reveal
        className="group relative isolate min-h-[380px] overflow-hidden rounded-[26px] bg-plum-deep text-[#F8F0EA] shadow-l md:min-h-[610px] md:rounded-[34px]"
      >
        <Image
          src={wok.imageUrl ?? ASSETS.backgrounds.wokSignature}
          alt="Авторский вок, собранный из своей основы, начинки и соуса"
          fill
          sizes="(min-width: 1280px) 1152px, 100vw"
          className="object-cover object-[64%_center] transition duration-[1200ms] group-hover:scale-[1.02]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#21151F]/95 via-[#21151F]/70 to-[#21151F]/5"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#21151F]/70 via-transparent to-[#21151F]/20"
        />

        <div className="relative flex min-h-[380px] flex-col justify-between p-5 md:min-h-[610px] md:p-12 lg:p-16">
          <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#F8F0EA]/65 md:text-[9.5px] md:tracking-[0.22em]">
            <GoldHairline width={32} />
            {wok.eyebrow}
          </div>

          <div>
            <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7B0C0] md:mb-4 md:text-[11px] md:tracking-[0.22em]">
              Основа → начинка → соус
            </span>
            <h2 className="max-w-[11ch] text-[28px] font-bold leading-[1] tracking-[-0.04em] md:text-[62px] md:leading-[0.98] md:tracking-[-0.045em]">
              {wok.title}
            </h2>
            <p className="mt-3.5 max-w-[48ch] text-[12.5px] font-medium leading-[1.65] text-[#F8F0EA]/70 md:mt-6 md:text-[14px] md:leading-[1.8]">
              {wok.text}
            </p>

            <div className="mt-5 grid max-w-[620px] grid-cols-3 border-t border-white/20 pt-4 md:mt-9 md:pt-6">
              {[
                ["3", "шага сборки"],
                ["3 минуты", "огонь вока"],
                ["1", "миска, придуманная вами"],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-white/15 pr-3 last:border-r-0 last:pl-4 md:px-5 md:first:pl-0">
                  <strong className="block text-[15px] font-bold md:text-[22px]">{value}</strong>
                  <span className="mt-1 block text-[7.5px] font-bold uppercase tracking-[0.14em] text-[#F8F0EA]/45 md:text-[9px] md:tracking-[0.16em]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href={wok.href}
              className="btn-sheen relative mt-5 inline-flex w-fit items-center gap-2.5 rounded-full bg-btn px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-m md:mt-8 md:gap-3 md:px-7 md:py-4"
            >
              {wok.buttonLabel} <ArrowUpRight className="text-[14px]" />
            </Link>
          </div>
        </div>
      </section>

      <section
        data-reveal
        className="mt-4 grid overflow-hidden rounded-[26px] border border-hair bg-paper-2 shadow-s md:mt-5 md:rounded-[34px] lg:grid-cols-[1.08fr_0.92fr]"
      >
        <div className="relative min-h-[200px] overflow-hidden lg:min-h-[520px]">
          <Image
            src={delivery.imageUrl ?? ASSETS.backgrounds.deliveryRitual}
            alt="Свежий заказ Гуд Кармы, подготовленный к доставке"
            fill
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover object-[42%_center] transition duration-[1000ms] hover:scale-[1.025]"
          />
          <div className="absolute left-4 top-4 rounded-full border border-white/25 bg-[#21151F]/35 px-3.5 py-1.5 text-[8.5px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md md:left-6 md:top-6 md:px-4 md:py-2 md:text-[9px] md:tracking-[0.18em]">
            С кухни — к вашему столу
          </div>
        </div>

        <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-tint-sakura via-paper-2 to-tint-mint p-5 md:p-12 lg:p-14">
          <CulturalAccent
            world="europe"
            className="-bottom-10 -right-8 hidden h-[230px] w-[154px] opacity-[0.28] xl:block"
          />
          <span
            aria-hidden
            className="absolute -right-6 -top-14 text-[150px] font-bold leading-none text-plum/5"
          >
            福
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry md:tracking-[0.22em]">
            {delivery.eyebrow}
          </span>
          <h2 className="mt-2.5 max-w-[10ch] text-[26px] font-bold leading-[1.04] tracking-[-0.04em] md:mt-4 md:text-[46px] md:leading-[1.03]">
            {delivery.title}
          </h2>
          <p className="mt-3 max-w-[42ch] text-[12.5px] leading-[1.65] text-ink-2 md:mt-5 md:text-[13.5px] md:leading-[1.75]">
            {delivery.text}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5 md:mt-7 md:gap-2">
            {["До 20 км", "Статусы заказа", "Самовывоз без ожидания"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-plum/15 bg-paper-2/55 px-3 py-2 text-[8.5px] font-bold uppercase tracking-[0.1em] text-ink-2 backdrop-blur-sm md:px-4 md:py-2.5 md:text-[9px] md:tracking-[0.12em]"
              >
                {item}
              </span>
            ))}
          </div>

          <Link
            href={delivery.href}
            className="btn-sheen relative mt-5 inline-flex w-fit items-center gap-2.5 rounded-full bg-btn px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-m md:mt-8 md:gap-3 md:px-7 md:py-4"
          >
            {delivery.buttonLabel} <ArrowUpRight className="text-[14px]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
