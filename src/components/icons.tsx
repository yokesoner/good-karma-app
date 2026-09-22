import { cn } from "@/lib/cn";

// Общие SVG-иконки. Раньше стрелка «↗» была текстовым символом: на iPhone
// Montserrat не содержит этого глифа, Safari подставляет Apple Color Emoji
// и рисует синий квадрат с белой стрелкой вместо тонкой линии (на ноутбуке
// глиф подставляется системным текстовым шрифтом, поэтому там всё выглядело
// правильно). SVG рисуется одинаково везде и берёт цвет из currentColor.
// Не возвращайте в разметку «↗», «↘», «↩» и другие символы, у которых есть
// эмодзи-вариант — на iOS они превратятся в цветные картинки.

type IconProps = { className?: string; strokeWidth?: number };

function Svg({
  className,
  strokeWidth = 1.7,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block h-[1em] w-[1em] shrink-0 align-[-0.125em]", className)}
    >
      {children}
    </svg>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </Svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function Phone(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1Z" />
    </Svg>
  );
}

export function Copy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
    </Svg>
  );
}

export function Truck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6.5h11v9.5H3z" />
      <path d="M14 9.5h3.6L21 13v3h-7" />
      <circle cx="7.5" cy="17.5" r="1.7" />
      <circle cx="17" cy="17.5" r="1.7" />
    </Svg>
  );
}

export function Bag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 8h13l-1 11.5h-11L5.5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </Svg>
  );
}

export function Pin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s6.5-5.6 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.4 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </Svg>
  );
}

// ---- админка ----

export type AdminIconName =
  | "orders"
  | "menu"
  | "stats"
  | "more"
  | "categories"
  | "wok"
  | "promo"
  | "karma"
  | "delivery"
  | "bell"
  | "team"
  | "banner"
  | "logout"
  | "home";

export function AdminIcon({ name, ...props }: IconProps & { name: AdminIconName }) {
  return (
    <Svg {...props}>
      {name === "orders" && (
        <>
          <path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 18.9V3.5Z" />
          <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
        </>
      )}
      {name === "menu" && (
        <>
          <path d="M7 3.5v8.2M4.6 3.5v5.2a2.4 2.4 0 0 0 4.8 0V3.5M7 11.7v8.8" />
          <path d="M16.5 20.5V3.5c-2.2 1.2-3.5 3.6-3.5 6.4v3.1h3.5" />
        </>
      )}
      {name === "stats" && (
        <>
          <path d="M4 20.5h16" />
          <path d="M7 17V11M12 17V5M17 17v-8" />
        </>
      )}
      {name === "more" && (
        <>
          <circle cx="5.5" cy="12" r="1.3" />
          <circle cx="12" cy="12" r="1.3" />
          <circle cx="18.5" cy="12" r="1.3" />
        </>
      )}
      {name === "categories" && (
        <>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
        </>
      )}
      {name === "wok" && (
        <>
          <path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z" />
          <path d="M8 6.5c0-1 .8-1.2.8-2.2M12 6.5c0-1 .8-1.2.8-2.2M16 6.5c0-1 .8-1.2.8-2.2" />
        </>
      )}
      {name === "promo" && (
        <>
          <path d="M3.5 9.5V6a1.5 1.5 0 0 1 1.5-1.5h14A1.5 1.5 0 0 1 20.5 6v3.5a2.5 2.5 0 0 0 0 5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18v-3.5a2.5 2.5 0 0 0 0-5Z" />
          <path d="M9.5 15.5 14.5 8.5" />
        </>
      )}
      {name === "karma" && <path d="M12 3l1.7 6.1L20 11l-6.3 1.9L12 19l-1.7-6.1L4 11l6.3-1.9L12 3Z" />}
      {name === "delivery" && (
        <>
          <path d="M3 6.5h11v9.5H3z" />
          <path d="M14 9.5h3.6L21 13v3h-7" />
          <circle cx="7.5" cy="17.5" r="1.7" />
          <circle cx="17" cy="17.5" r="1.7" />
        </>
      )}
      {name === "bell" && (
        <>
          <path d="M12 3a6 6 0 0 0-6 6v3.2c0 .5-.2 1-.5 1.4L4 15.5c-.6.7-.1 1.8.8 1.8h14.4c.9 0 1.4-1.1.8-1.8l-1.5-1.9a2.2 2.2 0 0 1-.5-1.4V9a6 6 0 0 0-6-6Z" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
        </>
      )}
      {name === "team" && (
        <>
          <circle cx="9" cy="8.5" r="3.2" />
          <path d="M3.5 19.5c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5" />
          <path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.7c1.7.5 2.8 2 3.1 4.3" />
        </>
      )}
      {name === "banner" && (
        <>
          <rect x="3.5" y="5" width="17" height="11" rx="2.2" />
          <path d="M7.5 9.5h6M7.5 12.5h3.5" />
          <path d="M9 20h6" />
        </>
      )}
      {name === "logout" && (
        <>
          <path d="M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14" />
          <path d="M10 8l-4 4 4 4M6 12h10" />
        </>
      )}
      {name === "home" && (
        <>
          <path d="M4 11.2 12 4.5l8 6.7" />
          <path d="M6 10v9.5h4.5v-5.5h3v5.5H18V10" />
        </>
      )}
    </Svg>
  );
}
