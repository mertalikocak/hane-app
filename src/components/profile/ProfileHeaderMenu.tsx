"use client";

import React, { useState, useRef, useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-blue-500 to-indigo-700",
  "from-violet-500 to-purple-800",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-teal-600",
];

interface ProfileHeaderMenuProps {
  variant?: "desktop" | "mobile";
}

export function ProfileHeaderMenu({ variant = "desktop" }: ProfileHeaderMenuProps) {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    openProfileModal,
    isLoaded,
  } = useProfile();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isLoaded) return null;

  const getInitials = (first: string, last?: string) => {
    const f = first ? first[0].toUpperCase() : "";
    const l = last ? last[0].toUpperCase() : "";
    return `${f}${l}` || "👤";
  };

  const activeIndex = profiles.findIndex((p) => p.id === activeProfileId);
  const activeGradient =
    activeIndex >= 0
      ? AVATAR_GRADIENTS[activeIndex % AVATAR_GRADIENTS.length]
      : "from-orange-500 to-amber-600";

  if (profiles.length === 0) {
    return (
      <button
        type="button"
        onClick={() => openProfileModal("create")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
      >
        <span>+</span>
        <span>Profil Oluştur</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-2xl border transition-all cursor-pointer select-none ${
          variant === "mobile"
            ? "h-9 px-2 bg-surface-raised border-border text-foreground"
            : "px-2.5 py-1.5 bg-surface hover:bg-surface-raised border-border/80 text-foreground shadow-xs"
        }`}
        title="Profil Değiştir"
      >
        {/* Avatar Circle */}
        <div
          className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${activeGradient} text-white font-black text-[10px] sm:text-xs shadow-xs`}
        >
          {activeProfile ? getInitials(activeProfile.firstName, activeProfile.lastName) : "👤"}
        </div>

        {/* Profile Name (Hidden or truncated on small screens) */}
        <div className="flex items-center gap-1 max-w-[110px] sm:max-w-[140px] truncate">
          <span className="text-xs font-bold truncate">
            {activeProfile ? activeProfile.firstName : "Profil Seç"}
          </span>
          <span className="text-[10px] text-muted">▾</span>
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-3xl border border-border/90 bg-surface/95 backdrop-blur-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
              Aktif Profil
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-extrabold text-foreground truncate">
                {activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : "Seçilmedi"}
              </span>
              <span className="text-xs">{activeProfile?.gender === "male" ? "👨" : "👩"}</span>
            </div>
          </div>

          {/* Quick Switch List */}
          <div className="space-y-1 max-h-48 overflow-y-auto py-1">
            <span className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
              Profiller
            </span>
            {profiles.map((p, idx) => {
              const isSelected = p.id === activeProfileId;
              const grad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
              const initials = getInitials(p.firstName, p.lastName);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActiveProfileId(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-foreground/80 hover:bg-surface-raised hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-white font-black text-[10px]`}
                    >
                      {initials}
                    </span>
                    <span className="truncate">{p.firstName} {p.lastName}</span>
                  </div>

                  {isSelected && <span className="text-primary font-bold">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-border/60 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openProfileModal("create");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer"
            >
              <span>+</span>
              <span>Yeni Profil Ekle</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openProfileModal("select");
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
            >
              <span>👥 Tüm Profiller / Yönet</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
