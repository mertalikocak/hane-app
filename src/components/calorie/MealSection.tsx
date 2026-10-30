"use client";

import React, { useState, useEffect } from "react";
import { FoodItem, MealType, SavedMealTemplate, SavedFoodItem, SharedMeal } from "@/domain/calorieTypes";
import { ChevronDownIcon, CloseIcon, PlusIcon } from "@/components/ui/Icons";

interface MealSectionProps {
  items: FoodItem[];
  savedTemplates: SavedMealTemplate[];
  savedFoods: SavedFoodItem[];
  sharedMeals?: SharedMeal[];
  selectedDate?: string;
  activeProfileId?: string;
  onRemoveItem: (id: string) => void;
  onOpenAddModalForMeal: (mealType: MealType) => void;
  onOpenFetchDinnerModal: () => void;
  onOpenSaveTemplateModal: (mealType: MealType, items: FoodItem[]) => void;
  onShareMeal?: (mealType: MealType, items: FoodItem[]) => void;
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
    colorClass: "bg-amber-500/10 text-amber-700 border-amber-500/25",
  },
  {
    type: "lunch",
    title: "Öğle Yemeği",
    icon: "☀️",
    colorClass: "bg-blue-500/10 text-blue-700 border-blue-500/25",
  },
  {
    type: "dinner",
    title: "Akşam Yemeği",
    icon: "🌙",
    colorClass: "bg-accent/70 text-primary border-border-lavender",
  },
  {
    type: "snack",
    title: "Ara Öğün / Atıştırmalık",
    icon: "🍎",
    colorClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
  },
];

export function MealSection({
  items,
  savedTemplates,
  savedFoods,
  sharedMeals = [],
  selectedDate,
  activeProfileId,
  onRemoveItem,
  onOpenAddModalForMeal,
  onOpenFetchDinnerModal,
  onOpenSaveTemplateModal,
  onShareMeal,
  onToggleSaveFood,
}: MealSectionProps) {
  const [openMeals, setOpenMeals] = useState<Record<MealType, boolean>>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hane_calorie_open_meals");
      if (saved) {
        setOpenMeals(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

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
    <div className="space-y-3">
      {/* Accordion Master Toggle Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAllMeals}
          className="secondary-button px-3 py-1.5 text-xs h-8 min-h-0"
          title={allOpen ? "Tüm öğünleri kapat" : "Tüm öğünleri aç"}
        >
          <span>{allOpen ? "🔼 Tümünü Kapat" : "🔽 Tümünü Aç"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
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

          // Bu öğün diğer kullanıcılarla paylaşılmış mı?
          const isMealShared =
            mealItems.length > 0 &&
            sharedMeals.some(
              (s) =>
                (!selectedDate || s.date === selectedDate) &&
                (!activeProfileId || s.sharedByProfileId === activeProfileId) &&
                s.mealType === cfg.type &&
                s.items.length === mealItems.length &&
                s.items.every((si) =>
                  mealItems.some(
                    (mi) => mi.name.toLowerCase().trim() === si.name.toLowerCase().trim()
                  )
                )
            );

          return (
            <div
              key={cfg.type}
              className="ds-card self-start flex flex-col p-4 transition duration-150"
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
                    isOpen ? "pb-3 border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${cfg.colorClass} text-lg shrink-0`}
                    >
                      {cfg.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">
                          {cfg.title}
                        </h3>

                        {/* Item count badge */}
                        <span className="ds-badge ds-badge-neutral text-[10px]">
                          {mealItems.length} yiyecek
                        </span>

                        {/* Kaydet / Kaydedildi Durumu */}
                        {mealItems.length > 0 && (
                          isMealSaved ? (
                            <span
                              onClick={(e) => e.stopPropagation()}
                              className="ds-badge ds-badge-warning text-[10px]"
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
                              className="text-[11px] font-bold text-warning hover:underline flex items-center gap-1 cursor-pointer"
                              title="Bu öğünü şablon olarak kaydet"
                            >
                              <span>💾</span>
                              <span>Öğünü Kaydet</span>
                            </button>
                          )
                        )}

                        {/* Paylaş / Paylaşıldı Durumu */}
                        {mealItems.length > 0 && onShareMeal && (
                          isMealShared ? (
                            <span
                              onClick={(e) => e.stopPropagation()}
                              className="ds-badge ds-badge-primary text-[10px]"
                            >
                              <span>🤝</span>
                              <span>Paylaşıldı</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onShareMeal(cfg.type, mealItems);
                              }}
                              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                              title="Bu öğünü diğer hane üyeleriyle paylaş"
                            >
                              <span>🤝</span>
                              <span>Paylaş</span>
                            </button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted tabular-nums">
                        <span>P: {Math.round(mealProtein)}g</span>
                        <span>•</span>
                        <span>K: {Math.round(mealCarbs)}g</span>
                        <span>•</span>
                        <span>Y: {Math.round(mealFat)}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <div className="text-right tabular-nums">
                      <span className="text-sm font-bold text-foreground">
                        {mealCalories}
                      </span>
                      <span className="text-[10px] text-muted ml-0.5">kcal</span>
                    </div>

                    {/* Animated Chevron Indicator */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised border border-border text-muted group-hover/header:text-foreground group-hover/header:border-primary/40 transition-transform duration-150 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                      title={isOpen ? "Öğünü Gizle" : "Öğünü Aç"}
                    >
                      <ChevronDownIcon size={14} />
                    </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isOpen && (
                  <div className="animate-in fade-in duration-150">
                    {/* Items List */}
                    <div className="py-3 space-y-2">
                      {mealItems.length === 0 ? (
                        <div className="py-5 text-center text-xs text-muted italic">
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
                              className="group flex items-center justify-between rounded-xl border border-border bg-surface-raised p-2.5 transition"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {item.name}
                                  </span>
                                  {item.source === "ai" && (
                                    <span className="ds-badge ds-badge-success text-[9px] px-1.5 py-0">
                                      AI
                                    </span>
                                  )}
                                  {item.source === "dinner" && (
                                    <span className="ds-badge ds-badge-primary text-[9px] px-1.5 py-0">
                                      Dinner
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5 tabular-nums">
                                  <span>{item.portion}</span>
                                  <span>•</span>
                                  <span>
                                    P:{Math.round(item.protein)}g K:{Math.round(item.carbs)}g Y:{Math.round(item.fat)}g
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-foreground mr-1 tabular-nums">
                                  {item.calories} kcal
                                </span>

                                {/* Save Single Food to Favorites */}
                                <button
                                  type="button"
                                  onClick={() => onToggleSaveFood(item)}
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer text-sm font-bold ${
                                    isFoodSaved
                                      ? "text-amber-600 bg-amber-500/15 border border-amber-500/35 opacity-100"
                                      : "text-muted hover:text-amber-600 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 hover:bg-surface border border-transparent"
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
                                  className="opacity-100 sm:opacity-60 sm:group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                                  title="Yiyeceği Sil"
                                  aria-label={`${item.name} öğesini sil`}
                                >
                                  <CloseIcon size={13} />
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
                          className="accent-button flex-1 py-2 text-xs"
                        >
                          <span>🍽️</span>
                          <span>Akşam Yemeğini Çek</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenAddModalForMeal(cfg.type)}
                        className={`secondary-button border-dashed py-2 text-xs ${
                          cfg.type === "dinner" ? "flex-1" : "w-full"
                        }`}
                      >
                        <PlusIcon size={14} className="text-primary" />
                        <span>{cfg.title} Ekle</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsed Summary Line when accordion is closed and has foods */}
                {!isOpen && mealItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleMeal(cfg.type)}
                    className="mt-2.5 pt-2.5 border-t border-border w-full flex items-center justify-between gap-2 text-left text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      {mealItems.map((i) => i.name).join(", ")}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-primary">
                      Detayları Gör
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
