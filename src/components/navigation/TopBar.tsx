"use client";

import React, { useState, useEffect } from "react";
import { ProfileHeaderMenu } from "@/components/profile/ProfileHeaderMenu";
import { useProfile } from "@/context/ProfileContext";
import { BoltIcon, SettingsIcon } from "@/components/ui/Icons";
import { triggerQuickAction } from "@/components/quick-action/QuickActionLauncher";
import { getBulgular, BULGU_EVENT } from "@/storage/bulguStorage";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  const { activeProfile, isLoaded } = useProfile();
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const list = getBulgular();
      setUnresolvedCount(list.filter((b) => !b.cozuldu).length);
    };
    updateCount();
    window.addEventListener(BULGU_EVENT, updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener(BULGU_EVENT, updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  const todayShort = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="hidden lg:flex h-16 items-center justify-between border-b border-border bg-surface/90 backdrop-blur-md px-8 shrink-0 z-30 sticky top-0">
      {/* Left: Dynamic Greeting & Date */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">
          {isLoaded && activeProfile
            ? `Merhaba, ${activeProfile.firstName}`
            : "Hane Yönetim Sistemi"}
        </span>
        <span className="h-3.5 w-[1px] bg-border-strong" />
        <span className="text-xs font-medium text-muted capitalize">
          {todayShort}
        </span>
      </div>

      {/* Right: Theme, Quick Action, Settings & Profile Switcher */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle variant="topbar" />

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("hane:open-ayarlar-modal"))}
          className="secondary-button min-h-[36px] px-3 py-1.5 text-xs font-medium"
          title="Hane App Ayarları (Bulut, Yedek, Bildirim, Bulgular)"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-foreground-secondary" />
          <span>Ayarlar</span>
          {unresolvedCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-accent text-foreground border border-border-lavender">
              {unresolvedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => triggerQuickAction("shopping")}
          className="accent-button min-h-[36px] px-3 py-1.5 text-xs"
          title="Hızlı Eylem (Ctrl+K)"
        >
          <BoltIcon className="w-3.5 h-3.5 text-primary" />
          <span>Hızlı Ekle</span>
          <span className="text-[10px] font-mono bg-surface/80 text-foreground-secondary px-1.5 py-0.5 rounded border border-border-lavender">
            Ctrl+K
          </span>
        </button>

        <ProfileHeaderMenu variant="desktop" />
      </div>
    </header>
  );
}
