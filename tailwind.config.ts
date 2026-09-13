import type { Config } from "tailwindcss";

// Каждый цвет — CSS-переменная, не hex-литерал: значения определены один
// раз в globals.css (светлая тема) и переопределены под [data-theme="dark"].
// Так тема переключается атрибутом на <html>, без единой правки в Tailwind.
//
// Обёртка rgb(var(--x) / <alpha-value>) обязательна — без неё модификаторы
// прозрачности (border-plum/30) молча выпадают из сборки, см. комментарий
// в globals.css с деталями проверки.
const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: withAlpha("--paper"),
          2: withAlpha("--paper-2"),
          3: withAlpha("--paper-3"),
        },
        ink: {
          DEFAULT: withAlpha("--ink"),
          2: withAlpha("--ink-2"),
          3: withAlpha("--ink-3"),
        },
        hair: "var(--hair)",
        "hair-soft": "var(--hair-soft)",
        plum: {
          DEFAULT: withAlpha("--plum"),
          deep: withAlpha("--plum-deep"),
        },
        cherry: {
          DEFAULT: withAlpha("--cherry"),
          soft: withAlpha("--cherry-soft"),
        },
        mint: {
          DEFAULT: withAlpha("--mint"),
          deep: withAlpha("--mint-deep"),
        },
        gold: withAlpha("--gold"),
        btn: {
          DEFAULT: withAlpha("--btn-bg"),
          fg: withAlpha("--btn-fg"),
        },
        // тонкие пастельные заливки секций/категорий — было --t-*
        tint: {
          sakura: withAlpha("--t-sakura"),
          mint: withAlpha("--t-mint"),
          gold: withAlpha("--t-gold"),
          plum: withAlpha("--t-plum"),
          sky: withAlpha("--t-sky"),
          peach: withAlpha("--t-peach"),
          ivory: withAlpha("--t-ivory"),
          cream: withAlpha("--t-cream"),
          beige: withAlpha("--t-beige"),
          lavender: withAlpha("--t-lavender"),
          blush: withAlpha("--t-blush"),
          rose: withAlpha("--t-rose"),
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      borderRadius: {
        s: "10px",
        m: "18px",
        l: "26px",
        xl: "34px",
        ph: "22px",
      },
      boxShadow: {
        s: "0 8px 28px -14px rgba(58,35,56,.26)",
        m: "0 18px 52px -26px rgba(58,35,56,.38)",
        l: "0 32px 88px -38px rgba(58,35,56,.5)",
      },
      maxWidth: {
        wrap: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
