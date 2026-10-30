"use client";

import React from "react";
import type { LocalMeal } from "@/lib/local-storage/store";
import { type DayOfWeek, DAY_LABELS } from "@/types/common";
import { DiceIcon, UtensilsIcon, CalendarIcon, ClockIcon } from "@/components/ui/Icons";

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
    <section className="rounded-[18px] border border-border-lavender bg-surface-lavender p-5 sm:p-6 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-4">
        {/* Top Row: Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-lavender bg-surface px-2.5 py-1 text-xs font-semibold text-primary">
              <UtensilsIcon className="h-3.5 w-3.5" />
              <span>Günün Akşam Yemeği</span>
            </span>
            {isShortcutOpen && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Kısayol
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenMealReminder && (
              <button
                type="button"
                onClick={onOpenMealReminder}
                className="inline-flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-lavender bg-surface text-foreground hover:bg-accent transition-colors cursor-pointer"
                title="Akşam yemeği bildirimi saatini ayarla"
              >
                <ClockIcon className="h-3.5 w-3.5 text-primary" />
                <span>Hatırlatıcı</span>
              </button>
            )}

            <span className="text-xs font-medium text-foreground-secondary flex items-center gap-1 capitalize">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              {todayFormatted}
            </span>
          </div>
        </div>

        {/* Main Content */}
        {hasMeals ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {todayMeals.map((m) => m.name).join(" & ")}
              </h2>
              <p className="text-xs sm:text-sm text-foreground-secondary">
                Bugün ({DAY_LABELS[todayDayOfWeek]}) için akşam menünüz hazır.
              </p>
            </div>

            {todayMeals.some((m) => m.ingredients && m.ingredients.length > 0) && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
                  Gereken Malzemeler
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {todayMeals.flatMap((meal) =>
                    meal.ingredients.map((ing) => (
                      <span
                        key={ing.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-surface border border-border px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        <span>{ing.name}</span>
                        <span className="text-[11px] text-muted tabular-nums">
                          ({ing.quantity} {ing.unit})
                        </span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onScrollToPlan}
                className="primary-button min-h-[36px] text-xs px-3.5 py-1.5"
              >
                <span>Haftalık Planda Gör</span>
              </button>

              <button
                type="button"
                onClick={onFillToday}
                className="secondary-button min-h-[36px] text-xs px-3.5 py-1.5"
                title="Bugün için başka bir yemek ata"
              >
                <DiceIcon className="h-3.5 w-3.5 text-primary" />
                <span>Rastgele Değiştir</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Bugün için henüz yemek belirlenmedi
              </h2>
              <p className="text-xs sm:text-sm text-foreground-secondary">
                Kayıtlı tariflerinizden tek tıkla rastgele atayabilir veya haftalık plandan seçebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onFillToday}
                className="primary-button min-h-[38px] text-xs px-3.5 py-2 whitespace-nowrap"
              >
                <DiceIcon className="h-4 w-4" />
                <span>Rastgele Yemek Ata</span>
              </button>

              <button
                type="button"
                onClick={onScrollToPlan}
                className="secondary-button min-h-[38px] text-xs px-3.5 py-2 whitespace-nowrap"
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
