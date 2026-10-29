"use client";

import React, { useState, useEffect } from "react";
import { ProfileHeaderMenu } from "@/components/profile/ProfileHeaderMenu";
import { useProfile } from "@/context/ProfileContext";
import { BoltIcon } from "@/components/ui/Icons";
import { triggerQuickAction } from "@/components/quick-action/QuickActionLauncher";
import { getBulgular, BULGU_EVENT } from "@/storage/bulguStorage";

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

      {/* Right: Quick Action, Bulgular, Ayarlar & Profile Switcher */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("hane:open-ayarlar-modal"))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-surface-raised/70 hover:bg-surface text-foreground font-bold text-xs transition cursor-pointer shadow-xs active:scale-98"
          title="Hane App Ayarları (Bulut, Yedek, Bildirim, Bulgular)"
        >
          <span>⚙️</span>
          <span>Ayarlar</span>
          {unresolvedCount > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
              📝 {unresolvedCount}
            </span>
          )}
        </button>

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

