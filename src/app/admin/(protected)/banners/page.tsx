import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { BANNER_SLOTS } from "@/lib/bannerSlots";
import { getBanner, getBannerOverrideKeys } from "@/server/siteBanners";

export const metadata: Metadata = { title: "Баннеры сайта — админка Гуд Карма" };

// Список всех баннеров сайта в одном месте: тексты и картинки, которые
// видит покупатель на главной и в меню, меняются здесь, а не в коде.
export default async function AdminBannersPage() {
  const [customized, banners] = await Promise.all([
    getBannerOverrideKeys(),
    Promise.all(BANNER_SLOTS.map((slot) => getBanner(slot.key))),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Контент сайта</p>
      <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight md:text-4xl">Баннеры</h1>
      <p className="mt-2 text-[13px] leading-snug text-ink-2">
        Нажмите на баннер, чтобы поменять заголовок, текст, кнопку или картинку. Изменения сразу видны на сайте.
      </p>

      <div className="mt-5 space-y-3">
        {BANNER_SLOTS.map((slot, index) => {
          const banner = banners[index]!;
          const isCustom = customized.has(slot.key);
          const hidden = "toggleable" in slot && slot.toggleable && !banner.isActive;
          return (
            <Link
              key={slot.key}
              href={`/admin/banners/${slot.key}`}
              className="flex items-center gap-3 rounded-[22px] border border-hair bg-paper-2 p-4 transition-colors active:bg-paper-3 hover:bg-paper-3/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-bold">{slot.name}</h2>
                  {hidden && (
                    <span className="rounded-full bg-paper-3 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                      выключен
                    </span>
                  )}
                  {isCustom && !hidden && (
                    <span className="rounded-full bg-tint-mint px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]">
                      изменён
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-ink-3">{slot.where}</p>
                {(banner.title || banner.text) && (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-ink-2">
                    {banner.title ? <b className="font-semibold">{banner.title}. </b> : null}
                    {banner.text}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
            </Link>
          );
        })}

        <Link
          href="/admin/promotions/banner"
          className="flex items-center gap-3 rounded-[22px] border border-hair bg-paper-2 p-4 transition-colors active:bg-paper-3 hover:bg-paper-3/60"
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold">Баннер страницы «Акции»</h2>
            <p className="mt-0.5 text-[12px] text-ink-3">Страница /promotions — заголовок, текст и фон вверху</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
        </Link>
      </div>
    </div>
  );
}
