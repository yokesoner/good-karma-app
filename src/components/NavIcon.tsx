export type NavIconName = "grid" | "spark" | "user" | "cart";

// Общие иконки навигации — раньше были продублированы дословно в
// Header.tsx (только cart) и MobileNav.tsx (все четыре).
export function NavIcon({
  name,
  className = "h-[18px] w-[18px]",
  strokeWidth = 1.45,
}: {
  name: NavIconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "grid" && (
        <>
          <rect x="4" y="4" width="6.2" height="6.2" rx="1.4" />
          <rect x="13.8" y="4" width="6.2" height="6.2" rx="1.4" />
          <rect x="4" y="13.8" width="6.2" height="6.2" rx="1.4" />
          <rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.4" />
        </>
      )}
      {name === "spark" && <path d="M12 3l1.7 6.1L20 11l-6.3 1.9L12 19l-1.7-6.1L4 11l6.3-1.9L12 3Z" />}
      {name === "user" && (
        <>
          <circle cx="12" cy="8.2" r="3.6" />
          <path d="M4.8 20c.7-3.7 3.6-5.9 7.2-5.9s6.5 2.2 7.2 5.9" />
        </>
      )}
      {name === "cart" && (
        <>
          <path d="M3 4.2h2.2l2.3 10.4h9.3l1.9-7.3H6.3" />
          <circle cx="9.6" cy="18.6" r="1.4" />
          <circle cx="16.8" cy="18.6" r="1.4" />
        </>
      )}
    </svg>
  );
}
