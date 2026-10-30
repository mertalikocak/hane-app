"use client";

import React, { useState } from "react";
import { FoodItem, MealType } from "@/domain/calorieTypes";
import { saveMealTemplate } from "@/storage/calorieStorage";
import { CloseIcon } from "@/components/ui/Icons";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 text-base">
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
            className="icon-button h-8 w-8"
          >
            <CloseIcon size={15} />
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
              className="field text-xs font-bold"
            />
          </div>

          {/* Items Preview */}
          <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted text-[11px] font-semibold border-b border-border pb-1 tabular-nums">
              <span>{items.length} Yiyecek</span>
              <span className="text-foreground font-bold">{totalCalories} kcal</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px]">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-muted tabular-nums">
                  <span className="truncate pr-2">{item.name} ({item.portion})</span>
                  <span className="font-semibold text-foreground shrink-0">{item.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button px-4 py-2 text-xs"
            >
              İptal
            </button>
            <button
              type="submit"
              className="primary-button px-5 py-2 text-xs"
            >
              Şablonu Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
