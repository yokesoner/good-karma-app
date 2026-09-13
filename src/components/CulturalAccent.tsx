import Image from "next/image";
import { ASSETS } from "@/lib/assets";
import { cn } from "@/lib/cn";

export function CulturalAccent({
  world,
  className,
  priority = false,
}: {
  world: "japan" | "europe";
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "cultural-accent pointer-events-none absolute select-none",
        world === "japan" ? "cultural-accent--japan" : "cultural-accent--europe",
        className,
      )}
    >
      <Image
        src={world === "japan" ? ASSETS.decor.japanLantern : ASSETS.decor.europeHarvest}
        alt=""
        fill
        priority={priority}
        sizes="240px"
        className="object-contain"
      />
    </span>
  );
}
