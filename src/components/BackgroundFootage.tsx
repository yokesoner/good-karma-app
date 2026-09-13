import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Анимированная WebP-подложка (лепестки, пар, чернильная дымка).
 * Правила из ТЗ, зашитые в компонент, чтобы их нельзя было случайно нарушить:
 * — не перехватывает клики и скрыт от скринридеров;
 * — не больше одного-двух слоёв на секцию (следим при использовании);
 * — при prefers-reduced-motion не показывается вовсе (класс motion-safe).
 */
export function BackgroundFootage({
  src,
  className,
  opacity = 0.5,
  priority = false,
}: {
  src: string;
  className?: string;
  opacity?: number;
  priority?: boolean;
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
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="object-cover"
      />
    </div>
  );
}
