"use client";

import React, { useState } from "react";
import { FoodItem, MealType } from "@/domain/calorieTypes";
import { saveMealTemplate } from "@/storage/calorieStorage";

interface SaveTemplateModalProps {
  isOpen: boolean;
  mealType: MealType;
  items: FoodItem[];
  onClose: () => void;
  onSaved: () => void;
}

const MEAL_NAMES: Record<MealType, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle Yemeği",
  dinner: "Akşam Yemeği",
  snack: "Ara Öğün",
};

export function SaveTemplateModal({
  isOpen,
  mealType,
  items,
  onClose,
  onSaved,
}: SaveTemplateModalProps) {
  const [title, setTitle] = useState(`Klasik ${MEAL_NAMES[mealType] || "Öğünüm"}`);

  if (!isOpen || items.length === 0) return null;

  const totalCalories = items.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    saveMealTemplate(title.trim(), mealType, items);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 text-base">
              💾
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Öğünü Şablon Olarak Kaydet
              </h3>
              <p className="text-[11px] text-muted">
                Her seferinde yapay zekaya sormadan tek tıkla ekleyin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Şablon Adı
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Klasik Kahvaltım"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-raised px-3.5 py-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Items Preview */}
          <div className="rounded-2xl border border-border/80 bg-surface-raised/50 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted text-[11px] font-semibold border-b border-border/50 pb-1">
              <span>{items.length} Yiyecek</span>
              <span className="text-foreground font-bold">{totalCalories} kcal</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px]">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-muted">
                  <span className="truncate pr-2">{item.name} ({item.portion})</span>
                  <span className="font-semibold text-foreground shrink-0">{item.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:text-foreground cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover cursor-pointer"
            >
              Şablonu Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
