"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BoltIcon } from "@/components/ui/Icons";
import { QuickActionModal, type QuickActionTab } from "./QuickActionModal";

export function QuickActionLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<QuickActionTab>("shopping");

  const openModal = useCallback((targetTab: QuickActionTab = "shopping") => {
    setTab(targetTab);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = (e: CustomEvent<{ tab?: QuickActionTab }>) => {
      openModal(e.detail?.tab || "shopping");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("hane:open-quick-action" as any, handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hane:open-quick-action" as any, handleCustomOpen);
    };
  }, [openModal]);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group">
        <button
          type="button"
          onClick={() => openModal("shopping")}
          className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-orange-500 text-white shadow-lg shadow-primary/35 hover:scale-108 hover:shadow-xl hover:shadow-primary/45 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 select-none"
          title="Hızlı Ekle (Ctrl + K)"
          aria-label="Hızlı Eylem Menüsü"
        >
          <BoltIcon className="w-6 h-6 animate-pulse" />
        </button>

        {/* Hover / hint pill on desktop */}
        <div className="hidden lg:group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/95 border border-border/80 shadow-md backdrop-blur-md text-xs font-bold text-foreground animate-in fade-in slide-in-from-right-2 pointer-events-none">
          <span>Hızlı Ekle</span>
          <span className="font-mono text-[10px] text-muted bg-surface-raised px-1 py-0.5 rounded border border-border">
            Ctrl+K
          </span>
        </div>
      </div>

      {/* Global Quick Action Modal */}
      <QuickActionModal
        isOpen={isOpen}
        onClose={closeModal}
        initialTab={tab}
      />
    </>
  );
}

/** Helper function to open quick action from anywhere in code */
export function triggerQuickAction(tab: QuickActionTab = "shopping") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hane:open-quick-action", { detail: { tab } })
    );
  }
}
