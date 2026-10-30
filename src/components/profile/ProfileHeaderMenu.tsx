"use client";

import React, { useState, useRef, useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";
import { ChevronDownIcon, PlusIcon, UserIcon, CheckIcon } from "@/components/ui/Icons";

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
    return `${f}${l}` || "K";
  };

  if (profiles.length === 0) {
    return (
      <button
        type="button"
        onClick={() => openProfileModal("create")}
        className="inline-flex h-9 items-center gap-1.5 px-3 rounded-[10px] bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        <span>Profil Oluştur</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-[10px] border transition-colors duration-150 cursor-pointer select-none ${
          variant === "mobile"
            ? "h-9 px-2.5 bg-surface border-border text-foreground hover:bg-surface-raised"
            : "h-9 px-2.5 bg-surface hover:bg-surface-raised border-border-strong text-foreground shadow-[var(--shadow-xs)]"
        }`}
        title="Profil Değiştir"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-white font-semibold text-[11px]">
          {activeProfile ? getInitials(activeProfile.firstName, activeProfile.lastName) : <UserIcon className="h-3.5 w-3.5" />}
        </div>

        <div className="flex items-center gap-1 max-w-[100px] sm:max-w-[130px] truncate">
          <span className="text-xs font-semibold truncate text-foreground">
            {activeProfile ? activeProfile.firstName : "Profil Seç"}
          </span>
          <ChevronDownIcon className="h-3 w-3 text-muted shrink-0" />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-60 rounded-[14px] border border-border-strong bg-surface p-2 shadow-[var(--shadow-md)] z-50 space-y-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 rounded-[10px] bg-background">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
              Aktif Profil
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-semibold text-foreground truncate">
                {activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : "Seçilmedi"}
              </span>
              <span className="text-[11px] font-medium text-muted">
                {activeProfile?.gender === "male" ? "Erkek" : "Kadın"}
              </span>
            </div>
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto py-1">
            <span className="px-2.5 text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
              Hane Üyeleri
            </span>
            {profiles.map((p) => {
              const isSelected = p.id === activeProfileId;
              const initials = getInitials(p.firstName, p.lastName);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActiveProfileId(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-accent text-foreground font-semibold"
                      : "text-foreground-secondary hover:bg-background hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold ${
                        isSelected ? "bg-primary text-white" : "bg-background-subtle text-foreground"
                      }`}
                    >
                      {initials}
                    </span>
                    <span className="truncate">{p.firstName} {p.lastName}</span>
                  </div>

                  {isSelected && <CheckIcon className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-border space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openProfileModal("create");
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-surface-lavender transition-colors duration-150 cursor-pointer"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Yeni Profil Ekle</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openProfileModal("select");
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-background transition-colors duration-150 cursor-pointer"
            >
              <span>Profilleri Yönet</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
