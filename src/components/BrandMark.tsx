export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 33V15.5l10.5 7.6M46 33V15.5l-10.5 7.6" />
      <path d="M18 33c0 10.4 6 16.6 14 16.6S46 43.4 46 33" />
      <path d="M24.6 35.6c1.3 1.5 3.1 1.5 4.4 0M35 35.6c1.3 1.5 3.1 1.5 4.4 0M32 40v1.6" />
      <path d="M6.5 33.5H13M7.6 38.6l5.4-1.4M57.5 33.5H51M56.4 38.6L51 37.2" />
    </svg>
  );
}
