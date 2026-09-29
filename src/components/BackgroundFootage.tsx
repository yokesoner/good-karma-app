import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Анимированная WebP-подложка (лепестки, пар, чернильная дымка).
 * Правила из ТЗ, зашитые в компонент, чтобы их нельзя было случайно нарушить:
 * — не перехватывает клики и скрыт от скринридеров;
 * — не больше одного-двух слоёв на секцию (следим при использовании);
 * — при prefers-reduced-motion не показывается вовсе (класс motion-safe);
 * — всегда грузится лениво и никогда не предзагружается. Раньше был проп
 *   priority: он добавлял <link rel="preload">, и полупрозрачный декор
 *   весом до 1,5 МБ конкурировал за сеть с LCP-фотографией первого экрана,
 *   а при reduced motion скачивался впустую. Ленивое изображение внутри
 *   display:none браузер не запрашивает вовсе.
 */
export function BackgroundFootage({
  src,
  className,
  opacity = 0.5,
}: {
  src: string;
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 hidden overflow-hidden motion-safe:block",
        className,
      )}
      style={{ opacity }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        unoptimized
        loading="lazy"
        className="object-cover"
      />
    </div>
  );
}
