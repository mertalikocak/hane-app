"use client";

import React from "react";
import { MacroSummary } from "@/domain/calorieTypes";

interface CalorieSummaryCardsProps {
  targetCalories: number;
  macros: MacroSummary;
}

export function CalorieSummaryCards({
  targetCalories,
  macros,
}: CalorieSummaryCardsProps) {
  const consumed = macros.calories;
  const remaining = targetCalories - consumed;
  const percent = targetCalories > 0 ? Math.min(100, Math.round((consumed / targetCalories) * 100)) : 0;
  const isOver = remaining < 0;

  // Standart dengeli makro hedefleri (Protein: %25, Karb: %50, Yağ: %25)
  // 1g Protein = 4 kcal, 1g Karb = 4 kcal, 1g Yağ = 9 kcal
  const targetProteinGrams = Math.round((targetCalories * 0.25) / 4);
  const targetCarbsGrams = Math.round((targetCalories * 0.5) / 4);
  const targetFatGrams = Math.round((targetCalories * 0.25) / 9);

  const proteinPercent = Math.min(100, Math.round((macros.protein / (targetProteinGrams || 1)) * 100));
  const carbsPercent = Math.min(100, Math.round((macros.carbs / (targetCarbsGrams || 1)) * 100));
  const fatPercent = Math.min(100, Math.round((macros.fat / (targetFatGrams || 1)) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main Calorie Progress Card */}
      <div className="lg:col-span-6 ds-card-lavender p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent border border-border-lavender text-primary text-sm font-bold">
              🔥
            </span>
            <span className="text-xs font-bold text-foreground">
              Günlük Kalori Dengesi
            </span>
          </div>
          <span
            className={`ds-badge tabular-nums ${
              isOver
                ? "ds-badge-danger"
                : remaining === 0
                ? "ds-badge-success"
                : "ds-badge-primary"
            }`}
          >
            {isOver
              ? `${Math.abs(remaining)} kcal Aşıldı`
              : `${remaining} kcal Kalan`}
          </span>
        </div>

        <div className="my-5 flex items-baseline justify-between">
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
              {consumed.toLocaleString("tr-TR")}
              <span className="text-sm font-semibold text-muted ml-1.5">
                / {targetCalories.toLocaleString("tr-TR")} kcal
              </span>
            </div>
            <p className="text-xs text-muted mt-1 font-medium">
              Günlük hedefin <span className="font-bold text-foreground tabular-nums">%{percent}</span> kadarı tamamlandı
            </p>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-surface border border-border-lavender overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOver ? "bg-rose-600" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted font-semibold px-0.5 tabular-nums">
            <span>0 kcal</span>
            <span>Hedef: {targetCalories} kcal</span>
          </div>
        </div>
      </div>

      {/* 3 Macro Cards */}
      <div className="lg:col-span-6 grid grid-cols-3 gap-3">
        {/* Protein Card */}
        <div className="ds-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-lg">🥩</span>
            <span className="text-[11px] font-bold text-muted">Protein</span>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {Math.round(macros.protein)}
              <span className="text-[11px] font-normal text-muted ml-0.5">g</span>
            </div>
            <div className="text-[10px] text-muted tabular-nums">
              Hedef: {targetProteinGrams}g
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-background-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-600 transition-all duration-300"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-rose-700 block text-right tabular-nums">
              %{proteinPercent}
            </span>
          </div>
        </div>

        {/* Karbonhidrat Card */}
        <div className="ds-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-lg">🍞</span>
            <span className="text-[11px] font-bold text-muted">Karb</span>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {Math.round(macros.carbs)}
              <span className="text-[11px] font-normal text-muted ml-0.5">g</span>
            </div>
            <div className="text-[10px] text-muted tabular-nums">
              Hedef: {targetCarbsGrams}g
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-background-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-600 transition-all duration-300"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-amber-700 block text-right tabular-nums">
              %{carbsPercent}
            </span>
          </div>
        </div>

        {/* Yağ Card */}
        <div className="ds-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-lg">🥑</span>
            <span className="text-[11px] font-bold text-muted">Yağ</span>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {Math.round(macros.fat)}
              <span className="text-[11px] font-normal text-muted ml-0.5">g</span>
            </div>
            <div className="text-[10px] text-muted tabular-nums">
              Hedef: {targetFatGrams}g
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-background-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block text-right tabular-nums">
              %{fatPercent}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
