"use client";

import { useState } from "react";
import { useCloudSync } from "./CloudSyncProvider";
import { FirebaseSetupModal } from "./FirebaseSetupModal";

export function CloudSyncIndicator({ variant = "sidebar" }: { variant?: "sidebar" | "header" | "compact" }) {
  const { syncState, isConfigured } = useCloudSync();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === "header" || variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
            syncState.status === "synced"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : syncState.status === "syncing"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse"
              : isConfigured
              ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
              : "border-border bg-surface-raised text-muted hover:text-foreground"
          }`}
          title="Firebase Bulut Senkronizasyonu"
        >
          <span className="text-xs">
            {syncState.status === "synced"
              ? "🟢"
              : syncState.status === "syncing"
              ? "🔄"
              : isConfigured
              ? "🔴"
              : "🔥"}
          </span>
          <span className="hidden sm:inline">
            {syncState.status === "synced"
              ? "Bulut Aktif"
              : syncState.status === "syncing"
              ? "Eşitleniyor"
              : isConfigured
              ? "Bağlantı Hatası"
              : "Bulut Eşitle"}
          </span>
        </button>

        <FirebaseSetupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-surface-raised/70 hover:bg-surface border border-border/70 text-foreground transition cursor-pointer shadow-xs group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
              syncState.status === "synced"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : syncState.status === "syncing"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : isConfigured
                ? "bg-rose-500/15 text-rose-500"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {syncState.status === "synced"
              ? "🟢"
              : syncState.status === "syncing"
              ? "🔄"
              : isConfigured
              ? "🔴"
              : "🔥"}
          </div>

          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {syncState.status === "synced"
                ? "Bulut Senkron: Aktif"
                : syncState.status === "syncing"
                ? "Eşitleniyor..."
                : isConfigured
                ? "Bulut: Hata"
                : "Bulut Kurulumu Yap"}
            </span>
            <span className="text-[10px] text-muted truncate">
              {syncState.status === "synced"
                ? "PC ve Mobil Anlık Senkron"
                : isConfigured
                ? syncState.errorMessage || "Bağlantı bekleniyor"
                : "Telefonda görmek için bağla"}
            </span>
          </div>
        </div>

        <span className="text-xs text-muted group-hover:text-foreground">⚙️</span>
      </button>

      <FirebaseSetupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
