import React, { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { PortalTheme, resolvePortalTheme } from "../lib/themePreference";

type Theme = PortalTheme;

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

function ThemeDock({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const isDark = theme === "dark";
  return <button type="button" onClick={toggleTheme} className="fixed bottom-5 end-5 z-[80] inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100 dark:shadow-black/20" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>{isDark ? <Sun size={16}/> : <Moon size={16}/>}<span>{isDark ? "Light" : "Dark"}</span></button>;
}

export function ThemeProvider({ children, switchable = true }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    return resolvePortalTheme(localStorage.getItem("maintainr-theme"));
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("maintainr-theme", theme);
  }, [theme]);

  const toggleTheme = switchable ? () => setTheme(previous => previous === "light" ? "dark" : "light") : undefined;

  return <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>{children}{toggleTheme && <ThemeDock theme={theme} toggleTheme={toggleTheme}/>}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
