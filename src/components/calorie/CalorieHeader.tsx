"use client";

import React from "react";
import { useProfile } from "@/context/ProfileContext";
import { ProfileCalorieMeta } from "@/domain/calorieTypes";

interface CalorieHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  profileMeta: ProfileCalorieMeta;
  targetCalories: number;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  onOpenAddModal: () => void;
  onOpenEditTargetModal: () => void;
}

export function CalorieHeader({
  selectedDate,
  onDateChange,
  profileMeta,
  targetCalories,
  hasApiKey,
  onOpenApiKeyModal,
  onOpenAddModal,
  onOpenEditTargetModal,
}: CalorieHeaderProps) {
  const { openProfileModal } = useProfile();

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split("T")[0];
    onDateChange(today);
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const formattedDate = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${selectedDate}T00:00:00`));

  return (
    <div className="space-y-4">
      {/* Top Bar: Title, Profile Badge, API Key Status, Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-primary/20 text-2xl shadow-xs">
              🥑
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Hane Kalori
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-primary/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary border border-primary/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AI Destekli
                </span>
              </div>
              <p className="text-xs text-muted font-medium">
                Yapay zeka ile günlük beslenme, kalori ve makro takibi
              </p>
            </div>
          </div>
        </div>

        {/* Actions: API Key status & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold transition cursor-pointer shadow-xs ${
              hasApiKey
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                : "border-border bg-surface-raised text-muted hover:text-foreground hover:bg-border/40"
            }`}
            title="Gemini API Anahtarı Ayarları"
          >
            <span>{hasApiKey ? "🔑" : "⚙️"}</span>
            <span className="hidden sm:inline">
              {hasApiKey ? "Gemini AI: Aktif" : "API Anahtarı Ayarla"}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:bg-primary-hover active:scale-95 transition cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            <span>Öğün Ekle</span>
          </button>
        </div>
      </div>

      {/* Profile & Fit Meta Bar */}
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Active Profile Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-sm">
              {profileMeta.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground truncate">
                  {profileMeta.name}
                </span>
                <button
                  type="button"
                  onClick={() => openProfileModal("select")}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  (Değiştir)
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted flex-wrap">
                <span>
                  Boy: <b className="text-foreground">{profileMeta.height || "-"} cm</b>
                </span>
                <span>•</span>
                <span>
                  Kilo: <b className="text-foreground">{profileMeta.weight || "-"} kg</b>
                </span>
                <span>•</span>
                <span>
                  BMR: <b className="text-foreground">{profileMeta.bmr} kcal</b>
                </span>
              </div>
            </div>
          </div>

          {/* Goal & Target Setting */}
          <div className="flex items-center gap-2 bg-surface-raised border border-border/60 rounded-2xl px-3 py-1.5 self-start md:self-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted font-medium">Günlük Kalori Hedefi</span>
              <span className="text-xs font-black text-foreground">
                {targetCalories} kcal
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenEditTargetModal}
              className="text-[10px] font-bold text-primary hover:text-primary-hover px-1.5 py-0.5 rounded-lg hover:bg-primary/10 transition cursor-pointer"
            >
              Düzenle
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-2 shadow-xs">
        <button
          type="button"
          onClick={handlePrevDay}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer text-sm font-bold"
          aria-label="Önceki Gün"
        >
          ←
        </button>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="text-xs font-bold text-foreground bg-transparent focus:outline-none cursor-pointer"
          />
          <span className="text-xs text-muted font-medium hidden sm:inline">
            ({formattedDate})
          </span>
          {!isToday && (
            <button
              type="button"
              onClick={handleToday}
              className="text-[11px] font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              Bugüne Dön
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer text-sm font-bold"
          aria-label="Sonraki Gün"
        >
          →
        </button>
      </div>
    </div>
  );
}
