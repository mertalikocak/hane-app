"use client";

import React, { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/ui/Icons";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "hane_theme_v1";
const THEME_EVENT = "hane:theme-changed";

const DARK_THEME_VARS: Record<string, string> = {
  "--background": "#141019",
  "--background-subtle": "#1B1622",
  "--surface": "#1F1927",
  "--surface-raised": "#282032",
  "--surface-lavender": "#2A1F38",
  "--surface-overlay": "rgba(8, 6, 12, 0.72)",
  "--foreground": "#F4EFFA",
  "--foreground-secondary": "#C8BDD6",
  "--muted": "#988AAA",
  "--placeholder": "#6E6080",
  "--primary": "#9B74B8",
  "--primary-hover": "#AD87C9",
  "--primary-active": "#865FA3",
  "--primary-foreground": "#FFFFFF",
  "--primary-ring": "rgba(155, 116, 184, 0.32)",
  "--accent": "#322542",
  "--accent-hover": "#3D2D50",
  "--accent-active": "#48365E",
  "--accent-foreground": "#F4EFFA",
  "--border": "#31283D",
  "--border-strong": "#433753",
  "--border-lavender": "#4E3B66",
  "--success": "#4CC38A",
  "--success-bg": "rgba(42, 123, 86, 0.18)",
  "--success-border": "rgba(76, 195, 138, 0.34)",
  "--warning": "#F0A44C",
  "--warning-bg": "rgba(184, 107, 25, 0.18)",
  "--warning-border": "rgba(240, 164, 76, 0.34)",
  "--danger": "#F26B6B",
  "--danger-bg": "rgba(194, 59, 59, 0.18)",
  "--danger-border": "rgba(242, 107, 107, 0.34)",
  "--info": "#78A5E3",
  "--info-bg": "rgba(74, 111, 165, 0.18)",
  "--info-border": "rgba(120, 165, 227, 0.34)",
};

export function applyThemeToDom(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;

  if (mode === "dark") {
    for (const [key, val] of Object.entries(DARK_THEME_VARS)) {
      root.style.setProperty(key, val);
    }
  } else {
    for (const key of Object.keys(DARK_THEME_VARS)) {
      root.style.removeProperty(key);
    }
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", mode === "dark" ? "#141019" : "#F5F0E8");
  }
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // ignore storage access issues
  }
  return "light";
}

export function setStoredTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore storage access issues
  }
  applyThemeToDom(mode);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: mode }));
}

interface ThemeToggleProps {
  variant?: "topbar" | "mobile" | "sidebar";
}

export function ThemeToggle({ variant = "topbar" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
    applyThemeToDom(initial);

    const handleThemeChange = () => {
      const next = getStoredTheme();
      setTheme(next);
      applyThemeToDom(next);
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === THEME_STORAGE_KEY) {
        handleThemeChange();
      }
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setStoredTheme(next);
  };

  if (variant === "sidebar") {
    return (
      <div
        className="grid grid-cols-2 gap-1 rounded-[10px] border border-border bg-background p-1"
        role="group"
        aria-label="Tema Seçimi"
      >
        <button
          type="button"
          onClick={() => {
            setTheme("light");
            setStoredTheme("light");
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2.5 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
            theme === "light"
              ? "bg-surface text-foreground shadow-[var(--shadow-xs)] border border-border"
              : "text-muted hover:text-foreground border border-transparent"
          }`}
        >
          <SunIcon className="h-3.5 w-3.5 text-warning" />
          <span>Açık Tema</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTheme("dark");
            setStoredTheme("dark");
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2.5 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
            theme === "dark"
              ? "bg-surface text-foreground shadow-[var(--shadow-xs)] border border-border-lavender"
              : "text-muted hover:text-foreground border border-transparent"
          }`}
        >
          <MoonIcon className="h-3.5 w-3.5 text-primary" />
          <span>Gece Modu</span>
        </button>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
        title={theme === "dark" ? "Açık Temaya Geç" : "Gece Moduna Geç"}
        aria-label={theme === "dark" ? "Açık Temaya Geç" : "Gece Moduna Geç"}
      >
        {theme === "dark" ? (
          <SunIcon className="h-4 w-4 text-warning" />
        ) : (
          <MoonIcon className="h-4 w-4 text-primary" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="secondary-button min-h-[36px] px-3 py-1.5 text-xs font-medium"
      title={theme === "dark" ? "Açık Temaya Geç" : "Gece Moduna Geç"}
      aria-label={theme === "dark" ? "Açık Temaya Geç" : "Gece Moduna Geç"}
    >
      {theme === "dark" ? (
        <>
          <SunIcon className="w-3.5 h-3.5 text-warning" />
          <span>Açık Tema</span>
        </>
      ) : (
        <>
          <MoonIcon className="w-3.5 h-3.5 text-primary" />
          <span>Gece Modu</span>
        </>
      )}
    </button>
  );
}
