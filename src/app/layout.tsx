import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { NavProgress } from "@/components/NavProgress";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { ThemeScript } from "@/components/ThemeScript";
import { SiteShell } from "@/components/SiteShell";
import { ToastHost } from "@/components/ToastHost";
import { StructuredData } from "@/components/StructuredData";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

// Цвет системной панели браузера на телефоне подстраивается под тему сайта
// (те же --paper светлой и тёмной темы), а не остаётся белым/чёрным.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E8" },
    { media: "(prefers-color-scheme: dark)", color: "#141017" },
  ],
};

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

// Метаданные генерируются на сервере — это то, чего прототип как статичный
// HTML не мог сделать динамически (og:image для акции дня, например).
// metadataBase раньше указывал на "goodkarma.cafe" — домен-заглушку из
// прототипа, которого не существует: все canonical- и og:url-ссылки на
// сайте были битыми. SITE_URL — тот же домен, что уже используется для
// QR-кода Karma Club и ссылок в Telegram-уведомлениях (см. siteUrl.ts),
// один источник истины вместо каждый раз захардкоженного домена.
const siteUrl = new URL(SITE_URL);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "Гуд Карма — паназиатское кафе", template: "%s — Гуд Карма" },
  description:
    "Роллы, рамен и вок на открытой кухне в Ставрополе. Доставим за 30—40 минут или отдадим с собой.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Гуд Карма",
    title: "Гуд Карма — паназиатское кафе",
    description: "Роллы, рамен и вок на открытой кухне в Ставрополе. Доставка за 30—40 минут.",
    images: ["/assets/backgrounds/hero_two_worlds.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ThemeScript намеренно меняет только атрибут html до гидратации React.
    // ViewTransitions оборачивает роутер — без неё next-view-transitions
    // Link ведёт себя как обычный next/link, без анимации перехода.
    <ViewTransitions>
      <html lang="ru" suppressHydrationWarning className={montserrat.variable}>
        <head>
          <ThemeScript />
        </head>
        <body className="font-sans antialiased">
          <StructuredData />
          <NavProgress />
          <RevealOnScroll />
          <SiteShell announcement={<AnnouncementBar />}>{children}</SiteShell>
          <ToastHost />
        </body>
      </html>
    </ViewTransitions>
  );
}
