import { useState, useEffect, useCallback, useMemo } from 'react';
import { I18nContext, STRINGS, LANG_KEY, THEME_KEY } from './i18n.js';

/** Til va mavzu (tungi rejim) holatini saqlovchi provayder. */
export default function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'ru' ? 'ru' : 'uz';
    } catch {
      return 'uz';
    }
  });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Mavzu: <html> ga .dark klassi + brauzer paneli rangi
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B1520' : '#F8FAFC');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const t = useCallback((key) => STRINGS[lang]?.[key] ?? STRINGS.uz[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, theme, setTheme, t }), [lang, theme, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
