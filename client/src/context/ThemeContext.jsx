import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'theme-midnight',
  currentTheme: 'theme-midnight',
  setTheme: () => {},
  changeTheme: () => {}
});

export const ALL_THEME_IDS = [
  'theme-midnight',
  'theme-cyberpunk',
  'theme-violet',
  'theme-light',
  'theme-aurora'
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('chakri_theme') || 'theme-midnight';
    } catch (e) {
      return 'theme-midnight';
    }
  });

  const applyThemeToDOM = (themeId) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    // Apply data-theme attribute
    root.setAttribute('data-theme', themeId);
    body.setAttribute('data-theme', themeId);

    // Remove any previously set theme classes and add the current one
    ALL_THEME_IDS.forEach((id) => {
      root.classList.remove(id);
      body.classList.remove(id);
    });
    root.classList.add(themeId);
    body.classList.add(themeId);
  };

  const setTheme = (newTheme) => {
    if (!newTheme) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem('chakri_theme', newTheme);
    } catch (e) {}
    applyThemeToDOM(newTheme);
  };

  // Synchronize on mount and whenever theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Listen to cross-tab storage updates
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'chakri_theme' && e.newValue && ALL_THEME_IDS.includes(e.newValue)) {
        setThemeState(e.newValue);
        applyThemeToDOM(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentTheme: theme,
        setTheme,
        changeTheme: setTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'theme-midnight',
      currentTheme: 'theme-midnight',
      setTheme: () => {},
      changeTheme: () => {}
    };
  }
  return context;
}
