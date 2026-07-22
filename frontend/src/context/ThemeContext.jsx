import { createContext, useContext, useEffect } from "react";
import { THEMES } from "../themes";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const activeThemeId = user?.activeTheme || "app";
  const theme = THEMES[activeThemeId] || THEMES.app;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([varName, value]) => {
      root.style.setProperty(varName, value);
    });
  }, [theme]);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
