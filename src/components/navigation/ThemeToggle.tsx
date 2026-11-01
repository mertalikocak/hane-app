"use client";

import React, { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/ui/Icons";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "hane_theme_v1";
const THEME_EVENT = "hane:theme-changed";

const DARK_THEME_VARS: Record<string, string> = {
  "--background": "#090d16",
  "--background-subtle": "#0f172a",
  "--surface": "#121926",
  "--surface-raised": "#182234",
  "--surface-lavender": "#1e293b",
  "--surface-overlay": "rgba(0, 0, 0, 0.72)",
  "--foreground": "#f8fafc",
  "--foreground-secondary": "#cbd5e1",
  "--muted": "#8e9bb2",
  "--placeholder": "#64748b",
  "--primary": "#f97316",
  "--primary-hover": "#fb923c",
  "--primary-active": "#ea580c",
  "--primary-foreground": "#ffffff",
  "--primary-ring": "rgba(249, 115, 22, 0.28)",
  "--accent": "#2c1a0e",
  "--accent-hover": "#3b2314",
  "--accent-active": "#4d2d19",
  "--accent-foreground": "#fed7aa",
  "--border": "#1f2c42",
  "--border-strong": "#2d3d59",
  "--border-lavender": "#432c18",
  "--success": "#34d399",
  "--success-bg": "rgba(16, 185, 129, 0.16)",
  "--success-border": "rgba(52, 211, 153, 0.32)",
  "--warning": "#fbbf24",
  "--warning-bg": "rgba(245, 158, 11, 0.16)",
  "--warning-border": "rgba(251, 191, 36, 0.32)",
  "--danger": "#f87171",
  "--danger-bg": "rgba(239, 68, 68, 0.16)",
  "--danger-border": "rgba(248, 113, 113, 0.32)",
  "--info": "#60a5fa",
  "--info-bg": "rgba(59, 130, 246, 0.16)",
  "--info-border": "rgba(96, 165, 250, 0.32)",
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
    metaTheme.setAttribute("content", mode === "dark" ? "#090d16" : "#f8fafc");
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
