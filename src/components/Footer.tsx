import Link from "next/link";
import { CafeMap } from "@/components/CafeMap";
import { CulturalAccent } from "@/components/CulturalAccent";
import { CAFE_ADDRESS } from "@/lib/delivery";

// Контент здесь пока статичный (адрес, часы, телефон) — как и в прототипе.
// Если это должно меняться из админки без деплоя, вынести в отдельную
// таблицу SiteSettings — сознательно не делаю это сейчас, чтобы не плодить
// сущности до появления самой админки (Фаза 3).
export function Footer() {
  return (
    <footer className="relative isolate mt-8 overflow-hidden rounded-t-xl bg-plum-deep px-6 py-14 text-[#EFE6EC] shadow-[0_-24px_70px_-45px_rgba(58,35,56,.75)] md:px-16 md:py-20">
      <CulturalAccent world="japan" className="-left-8 bottom-[-70px] hidden h-[280px] w-[185px] opacity-20 lg:block" />
      <CulturalAccent world="europe" className="-right-8 top-[-55px] hidden h-[280px] w-[185px] opacity-20 lg:block" />
      <div className="relative mx-auto max-w-wrap">
        <div className="text-[40px] font-extrabold uppercase leading-none tracking-tight md:text-[96px]">
          Гуд Карма
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#EFE6EC]/60 md:gap-6">
          <span>Pan Asian Café</span>
          <span className="normal-case tracking-[0.3em]">良いカルマ</span>
          <span>Ежедневно 11:00 — 23:00</span>
        </div>
        <p className="mt-7 max-w-[46ch] text-[15px] leading-relaxed text-[#EFE6EC]/75">
          Готовим паназиатскую кухню так, чтобы хотелось вернуться. Доставим
          за 30—40 минут или отдадим с собой на самовывоз.
        </p>

        <div className="mt-10 flex flex-wrap justify-between gap-6 border-t border-white/15 pt-6">
          <nav className="flex flex-wrap gap-5">
            <Link href="/menu" className="text-[13.5px] text-[#EFE6EC]/80 hover:text-white">
              Меню
            </Link>
            <Link href="/promotions" className="text-[13.5px] text-[#EFE6EC]/80 hover:text-white">
              Акции
            </Link>
          </nav>
          <div className="flex flex-wrap gap-5">
            <a href="tel:+78120000000" className="text-[13.5px] text-[#EFE6EC]/80 hover:text-white">
              +7 (812) 000-00-00
            </a>
            <a
              href="mailto:hi@goodkarma.cafe"
              className="text-[13.5px] text-[#EFE6EC]/80 hover:text-white"
            >
              hi@goodkarma.cafe
            </a>
            <span className="text-[13.5px] text-[#EFE6EC]/80">{CAFE_ADDRESS}</span>
          </div>
        </div>

        <CafeMap className="mt-8 text-[#EFE6EC]" />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <nav className="flex flex-wrap gap-5">
            <Link href="/terms" className="text-[11.5px] text-[#EFE6EC]/55 hover:text-white">
              Условия сервиса
            </Link>
            <Link href="/privacy" className="text-[11.5px] text-[#EFE6EC]/55 hover:text-white">
              Конфиденциальность
            </Link>
            <Link href="/karma-club/rules" className="text-[11.5px] text-[#EFE6EC]/55 hover:text-white">
              Правила Karma Club
            </Link>
          </nav>
          <div className="text-[11.5px] text-[#EFE6EC]/55">
            © {new Date().getFullYear()} Гуд Карма
          </div>
        </div>
      </div>
    </footer>
  );
}
