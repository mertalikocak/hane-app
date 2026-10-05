"use client";

import React from "react";
import Link from "next/link";
import type { LocalMeal } from "@/lib/local-storage/store";
import { type DayOfWeek, DAY_LABELS } from "@/types/common";
import { DiceIcon, UtensilsIcon, SparklesIcon, CalendarIcon } from "@/components/ui/Icons";

interface TodayMealBannerProps {
  todayMeals: LocalMeal[];
  todayDayOfWeek: DayOfWeek;
  onFillToday: () => void;
  onScrollToPlan: () => void;
  onOpenMealReminder?: () => void;
  isShortcutOpen?: boolean;
}

export function TodayMealBanner({
  todayMeals,
  todayDayOfWeek,
  onFillToday,
  onScrollToPlan,
  onOpenMealReminder,
  isShortcutOpen,
}: TodayMealBannerProps) {
  const todayFormatted = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const hasMeals = todayMeals.length > 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-red-500/5 p-5 sm:p-7 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-400/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-400">
              <span className="text-sm">🍽️</span> GÜNÜN YEMEĞİ
            </span>
            {isShortcutOpen && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary animate-pulse">
                ⚡ Kısayol
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMealReminder}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition cursor-pointer"
              title="Akşam yemeği bildirimi saatini ayarla"
            >
              <span>🔔</span>
              <span>Yemek Bildirimi</span>
            </button>

            <span className="text-xs font-medium text-muted flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              {todayFormatted}
            </span>
          </div>
        </div>

        {/* Content */}
        {hasMeals ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {todayMeals.map((m) => m.name).join(" & ")}
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Bugün {DAY_LABELS[todayDayOfWeek]} günü için akşam menünüz hazır! Afiyet olsun.
              </p>
            </div>

            {/* Ingredients pills if any */}
            {todayMeals.some((m) => m.ingredients && m.ingredients.length > 0) && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Gereken Malzemeler:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {todayMeals.flatMap((meal) =>
                    meal.ingredients.map((ing) => (
                      <span
                        key={ing.id}
                        className="inline-flex items-center gap-1 rounded-xl bg-surface/80 border border-border/80 px-2.5 py-1 text-xs font-medium text-foreground/90 shadow-2xs"
                      >
                        <span>{ing.name}</span>
                        <span className="text-[10px] text-muted">
                          ({ing.quantity} {ing.unit})
                        </span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onScrollToPlan}
                className="secondary-button text-xs font-bold py-2 px-3.5 cursor-pointer hover:bg-surface-raised"
              >
                <span>Haftalık Planda Gör</span>
                <span>↓</span>
              </button>

              <button
                type="button"
                onClick={onFillToday}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface/60 hover:bg-surface px-3 py-2 text-xs font-medium text-muted hover:text-foreground transition cursor-pointer"
                title="Bugün için başka bir yemek ata"
              >
                <DiceIcon className="h-3.5 w-3.5 text-orange-400" />
                <span>Başka Bir Yemek Seç / Değiştir</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Today State */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Bugün için henüz yemek belirlenmedi!
              </h3>
              <p className="text-xs sm:text-sm text-muted">
                Bugün ne pişireceğinizi düşünmeyin; kayıtlı yemeklerinizden hemen tek tıkla atayın.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onFillToday}
                className="primary-button text-xs sm:text-sm py-2 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md font-bold"
              >
                <DiceIcon className="h-4 w-4" />
                <span>Rastgele Yemek Ata</span>
              </button>

              <button
                type="button"
                onClick={onScrollToPlan}
                className="secondary-button text-xs py-2 px-3"
              >
                Plandan Seç
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
