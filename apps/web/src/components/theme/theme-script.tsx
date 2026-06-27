import { THEME_STORAGE_KEY } from './theme';

// Runs before first paint to set the theme class — prevents a flash of the wrong theme.
const THEME_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var p=localStorage.getItem(k)||'system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

/** Inline, blocking theme bootstrap injected into <head> (no flash of incorrect theme). */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} suppressHydrationWarning />;
}
