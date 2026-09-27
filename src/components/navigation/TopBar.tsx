"use client";

import React, { useState } from "react";
import { CloudSyncIndicator } from "./CloudSyncIndicator";
import { YedekModal } from "./YedekModal";
import { ProfileHeaderMenu } from "@/components/profile/ProfileHeaderMenu";
import { useProfile } from "@/context/ProfileContext";

export function TopBar() {
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const { activeProfile, isLoaded } = useProfile();

  return (
    <>
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

        {/* Right: Actions & Profile Switcher */}
        <div className="flex items-center gap-2.5">
          <CloudSyncIndicator variant="compact" />

          {/* Backup Button */}
          <button
            type="button"
            onClick={() => setIsBackupOpen(true)}
            className="flex h-9 items-center gap-1.5 px-3 rounded-2xl border border-border/80 bg-surface hover:bg-surface-raised text-xs font-bold text-foreground shadow-xs cursor-pointer transition"
            title="Tüm Hane Verilerini Yedekle / İçe Aktar"
          >
            <span>🔄</span>
            <span className="hidden sm:inline text-[11px]">Yedek</span>
          </button>

          {/* Profile Switcher Menu */}
          <ProfileHeaderMenu variant="desktop" />
        </div>
      </header>

      {/* Universal Backup Modal */}
      <YedekModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
}
