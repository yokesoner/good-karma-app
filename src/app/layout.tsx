import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { ThemeScript } from "@/components/ThemeScript";
import { SiteShell } from "@/components/SiteShell";
import { ToastHost } from "@/components/ToastHost";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

// Метаданные генерируются на сервере — это то, чего прототип как статичный
// HTML не мог сделать динамически (og:image для акции дня, например).
// На первом этапе значения статичные, один в один унаследованы от
// index.html; дальше их можно доставать из БД по акции/товару страницы.
export const metadata: Metadata = {
  metadataBase: new URL("https://goodkarma.cafe"),
  title: "Гуд Карма — паназиатское кафе",
  description:
    "Роллы, рамен и вок на открытой кухне. Доставим за 30—40 минут или отдадим с собой.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Гуд Карма",
    title: "Гуд Карма — паназиатское кафе",
    description: "Роллы, рамен и вок на открытой кухне. Доставка за 30—40 минут.",
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
          <SiteShell>{children}</SiteShell>
          <ToastHost />
        </body>
      </html>
    </ViewTransitions>
  );
}
