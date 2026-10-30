"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusIcon } from "@/components/ui/Icons";
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
      <div
        className="fixed z-40 flex items-center gap-2 group"
        style={{
          bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
          right: "calc(1.25rem + env(safe-area-inset-right, 0px))",
        }}
      >
        <button
          type="button"
          onClick={() => openModal("shopping")}
          className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary text-white shadow-[var(--shadow-md)] hover:bg-primary-hover active:bg-primary-active transition-colors duration-150 cursor-pointer border border-white/15 select-none"
          title="Hızlı Ekle (Ctrl + K)"
          aria-label="Hızlı Eylem Menüsü"
        >
          <PlusIcon className="w-5 h-5" />
        </button>

        <div className="hidden lg:group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-surface border border-border-strong shadow-[var(--shadow-sm)] text-xs font-semibold text-foreground pointer-events-none">
          <span>Hızlı İşlem</span>
          <span className="font-mono text-[10px] text-muted bg-background px-1.5 py-0.5 rounded border border-border">
            Ctrl+K
          </span>
        </div>
      </div>

      <QuickActionModal
        isOpen={isOpen}
        onClose={closeModal}
        initialTab={tab}
      />
    </>
  );
}

export function triggerQuickAction(tab: QuickActionTab = "shopping") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hane:open-quick-action", { detail: { tab } })
    );
  }
}
