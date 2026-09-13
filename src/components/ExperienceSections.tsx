import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { CulturalAccent } from "@/components/CulturalAccent";
import { GoldHairline } from "@/components/GoldHairline";

export function ExperienceSections() {
  return (
    <div className="mx-auto max-w-wrap px-5 py-8 md:px-16 md:py-14">
      <section className="group relative isolate min-h-[520px] overflow-hidden rounded-[34px] bg-plum-deep text-[#F8F0EA] shadow-l md:min-h-[610px]">
        <Image
          src={ASSETS.backgrounds.openKitchenStory}
          alt="Шеф завершает подачу рамена на открытой кухне"
          fill
          sizes="(min-width: 1280px) 1152px, 100vw"
          className="object-cover object-[64%_center] transition duration-[1200ms] group-hover:scale-[1.02]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#21151F]/95 via-[#21151F]/72 to-[#21151F]/5"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#21151F]/70 via-transparent to-[#21151F]/20"
        />

        <div className="relative flex min-h-[520px] flex-col justify-between p-7 md:min-h-[610px] md:p-12 lg:p-16">
          <div className="flex items-center gap-3 text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#F8F0EA]/65">
            <GoldHairline width={32} />
            Открытая кухня · кухня без кулис
          </div>

          <div>
            <span className="mb-4 block text-[11px] font-bold uppercase tracking-[0.22em] text-[#E7B0C0]">
              Всё начинается с рук
            </span>
            <h2 className="max-w-[11ch] text-[38px] font-bold leading-[0.98] tracking-[-0.045em] md:text-[62px]">
              Не просто меню. Живой ритм кухни.
            </h2>
            <p className="mt-6 max-w-[48ch] text-[13px] font-medium leading-[1.8] text-[#F8F0EA]/72 md:text-[14px]">
              Бульон варится восемь часов, рис заправляется перед сменой,
              а каждое блюдо собирается только после вашего заказа. Можно смотреть —
              нам нечего прятать.
            </p>

            <div className="mt-9 grid max-w-[620px] grid-cols-3 border-t border-white/20 pt-6">
              {[
                ["8 часов", "варим бульон"],
                ["3 минуты", "огонь вока"],
                ["0", "вчерашних блюд"],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-white/15 pr-3 last:border-r-0 last:pl-4 md:px-5 md:first:pl-0">
                  <strong className="block text-[17px] font-bold md:text-[22px]">{value}</strong>
                  <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.16em] text-[#F8F0EA]/45 md:text-[9px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid overflow-hidden rounded-[34px] border border-hair bg-paper-2 shadow-s lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[360px] overflow-hidden lg:min-h-[520px]">
          <Image
            src={ASSETS.backgrounds.deliveryRitual}
            alt="Свежий заказ Гуд Кармы, подготовленный к доставке"
            fill
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover object-[42%_center] transition duration-[1000ms] hover:scale-[1.025]"
          />
          <div className="absolute left-6 top-6 rounded-full border border-white/25 bg-[#21151F]/35 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            С кухни — к вашему столу
          </div>
        </div>

        <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-tint-sakura via-paper-2 to-tint-mint p-8 md:p-12 lg:p-14">
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
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cherry">
            Доставка как ритуал
          </span>
          <h2 className="mt-4 max-w-[10ch] text-[34px] font-bold leading-[1.03] tracking-[-0.04em] md:text-[46px]">
            Тепло остаётся внутри
          </h2>
          <p className="mt-5 max-w-[42ch] text-[13.5px] leading-[1.75] text-ink-2">
            Собираем заказ только после подтверждения, бережно упаковываем горячее
            отдельно от холодного и показываем каждый статус — без выдуманного обратного отсчёта.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {["До 20 км", "Статусы заказа", "Самовывоз без ожидания"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-plum/15 bg-paper-2/55 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-2 backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>

          <Link
            href="/checkout"
            className="relative mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-btn px-7 py-4 text-[10.5px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition hover:-translate-y-0.5 hover:shadow-m"
          >
            Оформить заказ <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
