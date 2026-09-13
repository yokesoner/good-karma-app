// Символы уровней: семечко, сакура, полумесяц, лотос.
// Тонкая линия в одном стиле, наследуют currentColor.
export function LevelIcon({ name, className }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "seed")
    return (
      <svg {...common}>
        <path d="M16 27v-9" />
        <path d="M16 18c0-4.4 3.4-8 8-8 0 4.4-3.4 8-8 8" />
        <path d="M16 21c0-3.6-2.9-6.5-6.5-6.5 0 3.6 2.9 6.5 6.5 6.5" />
      </svg>
    );

  if (name === "blossom")
    return (
      <svg {...common}>
        <circle cx="16" cy="9.5" r="4.2" />
        <circle cx="22.8" cy="19" r="4.2" />
        <circle cx="9.2" cy="19" r="4.2" />
        <circle cx="16" cy="16.5" r="1.8" />
      </svg>
    );

  if (name === "moon")
    return (
      <svg {...common}>
        <path d="M25 19.5A10.5 10.5 0 0 1 12.5 7 10.5 10.5 0 1 0 25 19.5z" />
      </svg>
    );

  // karma — лотос
  return (
    <svg {...common}>
      <path d="M16 24c-5 0-9-3.2-9-7 3 0 5.6 1.2 7.2 3" />
      <path d="M16 24c5 0 9-3.2 9-7-3 0-5.6 1.2-7.2 3" />
      <path d="M16 24c-2.5-2.4-4-5.4-4-8.4 0-3.2 1.6-6 4-7.6 2.4 1.6 4 4.4 4 7.6 0 3-1.5 6-4 8.4z" />
    </svg>
  );
}
