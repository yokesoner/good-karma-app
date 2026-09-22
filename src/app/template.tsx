// В отличие от layout, template пересоздаётся при каждом переходе между
// страницами — поэтому CSS-анимация .page-enter проигрывается заново и
// смена экрана выглядит как мягкое всплытие, а не резкая подмена.
// Сама анимация выключается при prefers-reduced-motion (см. globals.css).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
