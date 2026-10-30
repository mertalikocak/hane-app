"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { LocalShoppingItem, LocalMeal, LocalPlanEntry } from "@/lib/local-storage/store";
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/local-storage/store";
import { buildShoppingItems } from "@/services/local-shopping";
import Link from "next/link";
import {
  WhatsAppIcon,
  UtensilsIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

const STORAGE_KEY_CLEARED_FOOD_KEYS = "hane-shopping:cleared_food_keys";

function getClearedFoodKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLEARED_FOOD_KEYS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveClearedFoodKeys(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CLEARED_FOOD_KEYS, JSON.stringify(Array.from(keys)));
}

interface FoodShoppingSyncListProps {
  weekStart?: string;
  onOpenWhatsApp?: () => void;
}

export function FoodShoppingSyncList({ onOpenWhatsApp }: FoodShoppingSyncListProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [confirmClearCompleted, setConfirmClearCompleted] = useState(false);

  // Read dinner data from storage
  const [plans, setPlans] = useState<Record<string, LocalPlanEntry[]>>({});
  const [meals, setMeals] = useState<LocalMeal[]>([]);
  const [shoppingByWeek, setShoppingByWeek] = useState<Record<string, LocalShoppingItem[]>>({});
  const [clearedKeys, setClearedKeys] = useState<Set<string>>(new Set());

  const loadData = () => {
    setPlans(readStorage(STORAGE_KEYS.plans, {}));
    setMeals(readStorage(STORAGE_KEYS.meals, []));
    setShoppingByWeek(readStorage(STORAGE_KEYS.shopping, {}));
    setClearedKeys(getClearedFoodKeys());
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener("hane-dinner:storage", handleSync);
    window.addEventListener("hane-shopping:updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("hane-dinner:storage", handleSync);
      window.removeEventListener("hane-shopping:updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Collect all ingredients from all planned dinner meals across all weeks
  const allAssignments = useMemo(() => {
    const flat: LocalPlanEntry[] = [];
    for (const weekEntries of Object.values(plans)) {
      if (Array.isArray(weekEntries)) {
        flat.push(...weekEntries);
      }
    }
    return flat;
  }, [plans]);

  const ingredients = useMemo(() => {
    return allAssignments.flatMap((assignment) => {
      const meal = meals.find((m) => m.id === assignment.mealId);
      return meal?.ingredients ?? [];
    });
  }, [allAssignments, meals]);

  // Flatten previous shopping items across weeks
  const previousShoppingItems = useMemo(() => {
    const map = new Map<string, LocalShoppingItem>();
    for (const items of Object.values(shoppingByWeek)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.key) {
            map.set(item.key, item);
          }
        }
      }
    }
    return Array.from(map.values());
  }, [shoppingByWeek]);

  // Build combined current shopping items from ingredients
  const combinedShoppingItems = useMemo(() => {
    const built = buildShoppingItems(ingredients, previousShoppingItems);
    // Filter out items that were cleared/removed by the user
    return built.filter((item) => !clearedKeys.has(item.key));
  }, [ingredients, previousShoppingItems, clearedKeys]);

  const toggleItem = (key: string, isCompleted: boolean) => {
    // Update completion state in shoppingByWeek storage
    const updated = { ...shoppingByWeek };
    let found = false;

    for (const [wKey, items] of Object.entries(updated)) {
      if (Array.isArray(items)) {
        updated[wKey] = items.map((i) =>
          i.key === key ? { ...i, isCompleted } : i
        );
        if (items.some((i) => i.key === key)) {
          found = true;
        }
      }
    }

    if (!found) {
      // Put in a global/general bucket
      const general = updated["general"] || [];
      const existingIdx = general.findIndex((i) => i.key === key);
      if (existingIdx >= 0) {
        general[existingIdx].isCompleted = isCompleted;
      } else {
        const itemToToggle = combinedShoppingItems.find((i) => i.key === key);
        if (itemToToggle) {
          general.push({ ...itemToToggle, isCompleted });
        }
      }
      updated["general"] = general;
    }

    setShoppingByWeek(updated);
    writeStorage(STORAGE_KEYS.shopping, updated);
  };

  const handleClearCompleted = () => {
    const completedItems = combinedShoppingItems.filter((i) => i.isCompleted);
    if (completedItems.length === 0) return;

    const nextCleared = new Set(clearedKeys);
    completedItems.forEach((i) => nextCleared.add(i.key));

    setClearedKeys(nextCleared);
    saveClearedFoodKeys(nextCleared);
    setConfirmClearCompleted(false);
  };

  const completedCount = combinedShoppingItems.filter((i) => i.isCompleted).length;
  const progressPercent =
    combinedShoppingItems.length > 0
      ? Math.round((completedCount / combinedShoppingItems.length) * 100)
      : 0;

  const sortedItems = useMemo(() => {
    const uncompleted = combinedShoppingItems.filter((item) => !item.isCompleted);
    const completed = combinedShoppingItems.filter((item) => item.isCompleted);
    return [...uncompleted, ...completed];
  }, [combinedShoppingItems]);

  const handleCopy = async () => {
    const uncompleted = combinedShoppingItems.filter((item) => !item.isCompleted);
    if (uncompleted.length === 0) return;

    const lines = ["🥦 *Hane Dinner - Yemek Malzemeleri*"];
    uncompleted.forEach((i) => {
      lines.push(`• ${i.quantity} ${i.unit} ${i.ingredientName}`);
    });

    const text = lines.join("\n");
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <div className="ds-card-lavender p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary border border-border-lavender">
            <UtensilsIcon className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">Hane Dinner ile Tam Senkronize</h4>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Yemek planlarınızdaki tariflerin tüm malzemeleri tek bir listede toplanır. Alınanları temizleyerek listenizi her zaman güncel tutabilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dinner"
            className="secondary-button h-9 px-3.5 text-xs"
          >
            <span>Yemek Planına Git</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {combinedShoppingItems.length > 0
              ? `${completedCount} / ${combinedShoppingItems.length} malzeme alındı`
              : "Malzeme Yok"}
          </span>
          {combinedShoppingItems.length > 0 && (
            <span className="inline-flex items-center rounded-md border border-border-lavender bg-surface-lavender px-2 py-0.5 text-xs font-semibold text-primary">
              %{progressPercent} tamamlandı
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Alınanları Temizle */}
          {confirmClearCompleted ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-danger-border bg-danger-bg px-2.5 py-1">
              <span className="text-xs font-semibold text-danger">Alınan malzemeler temizlensin mi?</span>
              <button
                type="button"
                onClick={handleClearCompleted}
                className="rounded-lg bg-danger px-2.5 py-1 text-xs font-bold text-white cursor-pointer"
              >
                Evet, Temizle
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearCompleted(false)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-foreground-secondary hover:bg-surface cursor-pointer"
              >
                İptal
              </button>
            </div>
          ) : (
            completedCount > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearCompleted(true)}
                className="secondary-button h-9 px-3 text-xs text-danger hover:border-danger-border hover:bg-danger-bg"
                title="Alınmış yemek malzemelerini listeden temizle"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-danger" />
                <span>Alınanları Temizle ({completedCount})</span>
              </button>
            )
          )}

          {combinedShoppingItems.length > 0 && onOpenWhatsApp && (
            <button
              type="button"
              onClick={onOpenWhatsApp}
              className="secondary-button h-9 px-3 text-xs text-success border-success-border bg-success-bg hover:opacity-90"
              title="Malzemeleri WhatsApp ile paylaş"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-success" />
              <span>WhatsApp</span>
            </button>
          )}

          {combinedShoppingItems.length > 0 && (
            <button
              type="button"
              onClick={handleCopy}
              className="secondary-button h-9 px-3 text-xs"
            >
              {isCopied ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : null}
              <span>{isCopied ? "Kopyalandı!" : "Malzemeleri Kopyala"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <div className="ds-card p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border-lavender bg-surface-lavender text-primary">
            <UtensilsIcon className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-foreground">
            Alınacak yemek malzemesi yok
          </h4>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            Hane Dinner sayfasından yemekler planladığınızda gereken tüm malzemeler otomatik olarak burada listelenir.
          </p>
          <div className="pt-2">
            <Link
              href="/dinner"
              className="primary-button h-10 px-4 text-xs"
            >
              <span>Yemek Planına Git</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedItems.map((item) => (
            <div
              key={item.key}
              onClick={() => toggleItem(item.key, !item.isCompleted)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none group ${
                item.isCompleted
                  ? "bg-surface-raised/60 border-border/60 opacity-65"
                  : "bg-surface border-border hover:border-border-lavender hover:shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    item.isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border-strong bg-surface group-hover:border-primary"
                  }`}
                >
                  {item.isCompleted && <CheckIcon className="h-3.5 w-3.5" />}
                </div>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-sm font-semibold truncate ${
                      item.isCompleted
                        ? "line-through text-muted"
                        : "text-foreground"
                    }`}
                  >
                    {item.ingredientName}
                  </span>
                  <span className="text-xs text-muted mt-0.5">
                    Miktar: <strong className="font-semibold text-foreground-secondary">{item.quantity} {item.unit}</strong>
                  </span>
                </div>
              </div>

              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ml-2 ${
                  item.isCompleted
                    ? "border-border bg-surface-raised text-muted"
                    : "border-border-lavender bg-surface-lavender text-primary"
                }`}
              >
                {item.isCompleted ? "Alındı" : "Alınacak"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
