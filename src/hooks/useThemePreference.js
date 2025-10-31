import { useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "todo-react-app::theme";
export const THEME_OPTIONS = ["system", "light", "dark"];

const resolveTheme = (theme, mediaQuery) => {
  if (theme === "system") {
    return mediaQuery.matches ? "dark" : "light";
  }
  return theme;
};

export function useThemePreference() {
  const getInitialTheme = () => {
    if (typeof window === "undefined") {
      return "system";
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_OPTIONS.includes(stored) ? stored : "system";
  };

  const mediaQuery = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return null;
    }
    return window.matchMedia("(prefers-color-scheme: dark)");
  }, []);

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    if (!mediaQuery) {
      document.documentElement.dataset.theme =
        theme === "system" ? "light" : theme;
      return undefined;
    }

    const applyTheme = () => {
      const resolved = resolveTheme(theme, mediaQuery);
      document.documentElement.dataset.theme = resolved;
    };

    applyTheme();

    if (theme !== "system") {
      return undefined;
    }

    const handleChange = () => applyTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [mediaQuery, theme]);

  return { theme, setTheme };
}
