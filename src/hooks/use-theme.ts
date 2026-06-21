import { useState, useEffect, useCallback } from 'react';
import { getPreferences, setPreferences } from '@/lib/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const prefs = getPreferences();
    setThemeState(prefs.theme);
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark');
  }, []);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    setPreferences({ theme: t });
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
