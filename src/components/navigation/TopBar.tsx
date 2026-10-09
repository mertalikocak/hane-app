"use client";

import React from "react";
import { ProfileHeaderMenu } from "@/components/profile/ProfileHeaderMenu";
import { useProfile } from "@/context/ProfileContext";
import { BoltIcon } from "@/components/ui/Icons";
import { triggerQuickAction } from "@/components/quick-action/QuickActionLauncher";

export function TopBar() {
  const { activeProfile, isLoaded } = useProfile();

  return (
    <header className="hidden lg:flex h-16 items-center justify-between border-b border-border/70 bg-surface/80 backdrop-blur-md px-6 sm:px-8 shrink-0 z-30 sticky top-0">
      {/* Left: Dynamic Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-foreground">
            {isLoaded && activeProfile
              ? `Merhaba, ${activeProfile.firstName} 👋`
              : "Hane App"}
          </span>
          <span className="text-[11px] text-muted font-medium">
            Ev & Yaşam Yönetim Çatısı
          </span>
        </div>
      </div>

      {/* Right: Quick Action & Profile Switcher */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => triggerQuickAction("shopping")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition cursor-pointer shadow-xs active:scale-98"
          title="Hızlı Eylem (Ctrl+K)"
        >
          <BoltIcon className="w-3.5 h-3.5" />
          <span>Hızlı Ekle</span>
          <span className="text-[10px] font-mono bg-primary/20 px-1.5 py-0.5 rounded-md">Ctrl+K</span>
        </button>

        <ProfileHeaderMenu variant="desktop" />
      </div>
    </header>
  );
}
