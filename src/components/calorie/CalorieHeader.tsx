"use client";

import React from "react";
import { useProfile } from "@/context/ProfileContext";
import { ProfileCalorieMeta } from "@/domain/calorieTypes";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  KaloriIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SettingsIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

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
      <PageHeader
        title="Hane Kalori"
        subtitle="Yapay zeka ile günlük beslenme, kalori ve makro takibi."
        icon={<KaloriIcon size={20} />}
        badge={
          <span className="ds-badge ds-badge-primary">
            <SparklesIcon size={12} />
            AI Destekli
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className={`secondary-button px-3 py-2 text-xs ${
                hasApiKey
                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15"
                  : ""
              }`}
              title="Gemini API Anahtarı Ayarları"
            >
              <SettingsIcon size={14} />
              <span className="hidden sm:inline">
                {hasApiKey ? "Gemini AI: Aktif" : "API Anahtarı Ayarla"}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="primary-button px-4 py-2 text-xs"
            >
              <PlusIcon size={15} />
              <span>Öğün Ekle</span>
            </button>
          </div>
        }
      />

      {/* Profile & Fit Meta Bar */}
      <div className="ds-card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Active Profile Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/70 border border-border-lavender text-primary font-bold text-sm">
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
              <div className="flex items-center gap-2 text-[11px] text-muted flex-wrap tabular-nums">
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
          <div className="flex items-center gap-3 bg-surface-raised border border-border rounded-xl px-3.5 py-2 self-start md:self-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted font-medium">Günlük Kalori Hedefi</span>
              <span className="text-xs font-bold text-foreground tabular-nums">
                {targetCalories} kcal
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenEditTargetModal}
              className="accent-button px-2.5 py-1 text-[11px] h-7 min-h-0"
            >
              Düzenle
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="ds-card flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={handlePrevDay}
          className="icon-button h-8 w-8"
          aria-label="Önceki Gün"
        >
          <ChevronLeftIcon size={16} />
        </button>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="text-xs font-bold text-foreground bg-transparent focus:outline-none cursor-pointer tabular-nums"
          />
          <span className="text-xs text-muted font-medium hidden sm:inline">
            ({formattedDate})
          </span>
          {!isToday && (
            <button
              type="button"
              onClick={handleToday}
              className="accent-button px-2.5 py-1 text-[11px] h-7 min-h-0"
            >
              Bugüne Dön
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          className="icon-button h-8 w-8"
          aria-label="Sonraki Gün"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}
