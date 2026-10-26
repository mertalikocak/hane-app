"use client";

import React, { useState } from "react";
import { FoodItem, MealType, SavedMealTemplate, SavedFoodItem } from "@/domain/calorieTypes";

interface MealSectionProps {
  items: FoodItem[];
  savedTemplates: SavedMealTemplate[];
  savedFoods: SavedFoodItem[];
  onRemoveItem: (id: string) => void;
  onOpenAddModalForMeal: (mealType: MealType) => void;
  onOpenFetchDinnerModal: () => void;
  onOpenSaveTemplateModal: (mealType: MealType, items: FoodItem[]) => void;
  onToggleSaveFood: (item: FoodItem) => void;
}

interface MealConfig {
  type: MealType;
  title: string;
  icon: string;
  colorClass: string;
}

const MEAL_CONFIGS: MealConfig[] = [
  {
    type: "breakfast",
    title: "Kahvaltı",
    icon: "🌅",
    colorClass: "from-amber-500/15 to-orange-500/5 text-amber-500 border-amber-500/20",
  },
  {
    type: "lunch",
    title: "Öğle Yemeği",
    icon: "☀️",
    colorClass: "from-blue-500/15 to-indigo-500/5 text-blue-500 border-blue-500/20",
  },
  {
    type: "dinner",
    title: "Akşam Yemeği",
    icon: "🌙",
    colorClass: "from-purple-500/15 to-pink-500/5 text-purple-500 border-purple-500/20",
  },
  {
    type: "snack",
    title: "Ara Öğün / Atıştırmalık",
    icon: "🍎",
    colorClass: "from-emerald-500/15 to-teal-500/5 text-emerald-500 border-emerald-500/20",
  },
];

export function MealSection({
  items,
  savedTemplates,
  savedFoods,
  onRemoveItem,
  onOpenAddModalForMeal,
  onOpenFetchDinnerModal,
  onOpenSaveTemplateModal,
  onToggleSaveFood,
}: MealSectionProps) {
  const [openMeals, setOpenMeals] = useState<Record<MealType, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hane_calorie_open_meals");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // ignore
      }
    }
    return {
      breakfast: true,
      lunch: true,
      dinner: true,
      snack: true,
    };
  });

  const toggleMeal = (type: MealType) => {
    setOpenMeals((prev) => {
      const next = { ...prev, [type]: !prev[type] };
      try {
        localStorage.setItem("hane_calorie_open_meals", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const allOpen = Object.values(openMeals).every(Boolean);

  const toggleAllMeals = () => {
    const newState: Record<MealType, boolean> = {
      breakfast: !allOpen,
      lunch: !allOpen,
      dinner: !allOpen,
      snack: !allOpen,
    };
    setOpenMeals(newState);
    try {
      localStorage.setItem("hane_calorie_open_meals", JSON.stringify(newState));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-2">
      {/* Accordion Master Toggle Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAllMeals}
          className="text-[11px] font-bold text-muted hover:text-foreground flex items-center gap-1.5 transition cursor-pointer px-2.5 py-1 rounded-xl bg-surface border border-border/70 hover:bg-surface-raised shadow-2xs"
          title={allOpen ? "Tüm öğünleri kapat" : "Tüm öğünleri aç"}
        >
          <span>{allOpen ? "🔼 Tümünü Kapat" : "🔽 Tümünü Aç"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEAL_CONFIGS.map((cfg) => {
          const isOpen = Boolean(openMeals[cfg.type]);
          const mealItems = items.filter((item) => item.mealType === cfg.type);
          const mealCalories = mealItems.reduce(
            (sum, i) => sum + (Number(i.calories) || 0),
            0
          );
          const mealProtein = mealItems.reduce(
            (sum, i) => sum + (Number(i.protein) || 0),
            0
          );
          const mealCarbs = mealItems.reduce(
            (sum, i) => sum + (Number(i.carbs) || 0),
            0
          );
          const mealFat = mealItems.reduce(
            (sum, i) => sum + (Number(i.fat) || 0),
            0
          );

          // Bu öğündeki yiyeceklerin tamamı şablon olarak zaten kayıtlı mı?
          const isMealSaved =
            mealItems.length > 0 &&
            savedTemplates.some(
              (t) =>
                t.mealType === cfg.type &&
                t.items.length === mealItems.length &&
                t.items.every((ti) =>
                  mealItems.some(
                    (mi) => mi.name.toLowerCase().trim() === ti.name.toLowerCase().trim()
                  )
                )
            );

          return (
            <div
              key={cfg.type}
              className={`flex flex-col rounded-3xl border border-border bg-surface p-4 shadow-xs transition duration-200 ${
                isOpen
                  ? "justify-between hover:border-border/80"
                  : "hover:border-primary/40 hover:bg-surface-raised/40"
              }`}
            >
              <div>
                {/* Meal Card Header (Clickable Accordion Trigger) */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => toggleMeal(cfg.type)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleMeal(cfg.type);
                    }
                  }}
                  className={`flex items-center justify-between cursor-pointer select-none group/header ${
                    isOpen ? "pb-3 border-b border-border/70" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br border ${cfg.colorClass} text-lg shadow-2xs shrink-0`}
                    >
                      {cfg.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">
                          {cfg.title}
                        </h3>

                        {/* Item count badge */}
                        <span className="text-[10px] font-semibold text-muted bg-surface-raised px-1.5 py-0.5 rounded-md border border-border/60">
                          {mealItems.length} yiyecek
                        </span>

                        {/* Kaydet / Kaydedildi Durumu */}
                        {mealItems.length > 0 && (
                          isMealSaved ? (
                            <span
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg flex items-center gap-1"
                            >
                              <span>✓</span>
                              <span>Kaydedildi</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenSaveTemplateModal(cfg.type, mealItems);
                              }}
                              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="Bu öğünü şablon olarak kaydet"
                            >
                              <span>💾</span>
                              <span>Öğünü Kaydet</span>
                            </button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <span>P: {Math.round(mealProtein)}g</span>
                        <span>•</span>
                        <span>K: {Math.round(mealCarbs)}g</span>
                        <span>•</span>
                        <span>Y: {Math.round(mealFat)}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <div className="text-right">
                      <span className="text-sm font-black text-foreground">
                        {mealCalories}
                      </span>
                      <span className="text-[10px] text-muted ml-0.5">kcal</span>
                    </div>

                    {/* Animated Chevron Indicator */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl bg-surface-raised border border-border/60 text-muted group-hover/header:text-foreground group-hover/header:border-primary/40 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                      title={isOpen ? "Öğünü Gizle" : "Öğünü Aç"}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isOpen && (
                  <div className="animate-in fade-in duration-200">
                    {/* Items List */}
                    <div className="py-3 space-y-2">
                      {mealItems.length === 0 ? (
                        <div className="py-5 text-center text-xs text-muted/70 italic">
                          Henüz yiyecek eklenmedi
                        </div>
                      ) : (
                        mealItems.map((item) => {
                          const isFoodSaved = savedFoods.some(
                            (sf) => sf.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                          );

                          return (
                            <div
                              key={item.id}
                              className="group flex items-center justify-between rounded-2xl border border-border/60 bg-surface-raised/60 p-2.5 hover:bg-surface-raised transition"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {item.name}
                                  </span>
                                  {item.source === "ai" && (
                                    <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 text-[9px] font-extrabold text-emerald-500">
                                      AI
                                    </span>
                                  )}
                                  {item.source === "dinner" && (
                                    <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-1 py-0.2 text-[9px] font-extrabold text-purple-500">
                                      Dinner
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                                  <span>{item.portion}</span>
                                  <span>•</span>
                                  <span className="text-muted/80">
                                    P:{Math.round(item.protein)}g K:{Math.round(item.carbs)}g Y:{Math.round(item.fat)}g
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-foreground mr-1">
                                  {item.calories} kcal
                                </span>

                                {/* Save Single Food to Favorites (Yellow star if saved) */}
                                <button
                                  type="button"
                                  onClick={() => onToggleSaveFood(item)}
                                  className={`flex h-7 w-7 items-center justify-center rounded-xl transition cursor-pointer text-sm font-bold ${
                                    isFoodSaved
                                      ? "text-amber-400 bg-amber-500/15 border border-amber-500/35 opacity-100 shadow-xs scale-105"
                                      : "text-muted hover:text-amber-400 opacity-35 group-hover:opacity-90 hover:bg-surface border border-transparent"
                                  }`}
                                  title={isFoodSaved ? "Favorilerden Çıkar (Kaydedildi)" : "Favorilere Kaydet"}
                                  aria-label={`${item.name} favori durumunu değiştir`}
                                >
                                  ★
                                </button>

                                {/* Delete Item */}
                                <button
                                  type="button"
                                  onClick={() => onRemoveItem(item.id)}
                                  className="opacity-40 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                                  title="Yiyeceği Sil"
                                  aria-label={`${item.name} öğesini sil`}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-1 flex items-center gap-2">
                      {cfg.type === "dinner" && (
                        <button
                          type="button"
                          onClick={onOpenFetchDinnerModal}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition cursor-pointer"
                        >
                          <span>🍽️</span>
                          <span>Akşam Yemeğini Çek</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenAddModalForMeal(cfg.type)}
                        className={`flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/80 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-raised hover:border-primary/40 transition cursor-pointer ${
                          cfg.type === "dinner" ? "flex-1" : "w-full"
                        }`}
                      >
                        <span className="text-primary font-bold">+</span>
                        <span>{cfg.title} Ekle</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

