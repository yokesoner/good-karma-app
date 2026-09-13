// Ставим data-theme ДО первой отрисовки, синхронным инлайн-скриптом.
// Если сделать это в useEffect — пользователь на секунду увидит другую
// тему, а затем резкое переключение. Прототип хранил тему в localStorage
// под ключом gk_theme, оставляем тот же ключ. Для первого визита выбираем
// светлую ivory-подачу: она является основной брендовой витриной сайта,
// а тёмная тема остаётся осознанным выбором гостя.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("gk_theme");
    var theme = stored === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
