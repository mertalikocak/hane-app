"use client";

import React from "react";
import { ProfileHeaderMenu } from "@/components/profile/ProfileHeaderMenu";
import { useProfile } from "@/context/ProfileContext";

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

      {/* Right: Profile Switcher */}
      <div className="flex items-center gap-2.5">
        <ProfileHeaderMenu variant="desktop" />
      </div>
    </header>
  );
}
