import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { getBanner } from "@/server/siteBanners";

// Тонкая полоска над шапкой — для срочных объявлений («сегодня доставка
// бесплатно», «кафе закрыто на праздник»). Текст, ссылка и переключатель
// «показывать» — в /admin/banners. По умолчанию выключена и ничего не рисует.
export async function AnnouncementBar() {
  const banner = await getBanner("announcement");
  if (!banner.isActive || !banner.text) return null;

  const content = (
    <span className="mx-auto flex max-w-wrap items-center justify-center gap-2 px-4 py-2 text-center text-[12px] font-semibold leading-snug">
      <span className="min-w-0">{banner.text}</span>
      {banner.href && (
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap underline decoration-btn-fg/40 underline-offset-2">
          {banner.buttonLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </span>
  );

  const className = "block bg-btn text-btn-fg";
  if (!banner.href) return <div className={className}>{content}</div>;
  if (/^https:\/\//i.test(banner.href)) {
    return (
      <a href={banner.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={banner.href} className={className}>
      {content}
    </Link>
  );
}
