export const THEME_STORAGE_KEY = "mira.theme";

export function ThemeNoFlashScript() {
  const code = `
(function(){
  try {
    var m = localStorage.getItem('${THEME_STORAGE_KEY}') || 'auto';
    var dark = m === 'dark' || (m === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
