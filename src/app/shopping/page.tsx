"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import {
  ShoppingBagIcon,
  UtensilsIcon,
  WhatsAppIcon,
} from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { CustomShoppingList } from "@/components/shopping/CustomShoppingList";
import { FoodShoppingSyncList } from "@/components/shopping/FoodShoppingSyncList";
import { WhatsAppShareModal } from "@/components/shopping/WhatsAppShareModal";
import { getCustomShoppingList } from "@/storage/shoppingStorage";
import { readStorage, STORAGE_KEYS, type LocalShoppingItem, type LocalPlanEntry, type LocalMeal } from "@/lib/local-storage/store";
import { buildShoppingItems } from "@/services/local-shopping";

type ShoppingTab = "custom" | "food";

function ShoppingContent() {
  const [activeTab, setActiveTab] = useState<ShoppingTab>("custom");
  const [customItems, setCustomItems] = useState(() => getCustomShoppingList());
  const [foodItems, setFoodItems] = useState<LocalShoppingItem[]>([]);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const refreshCustomItems = () => {
    setCustomItems(getCustomShoppingList());
  };

  const refreshFoodItems = () => {
    const plans = readStorage<Record<string, LocalPlanEntry[]>>(STORAGE_KEYS.plans, {});
    const meals = readStorage<LocalMeal[]>(STORAGE_KEYS.meals, []);
    const shoppingByWeek = readStorage<Record<string, LocalShoppingItem[]>>(STORAGE_KEYS.shopping, {});

    const allAssignments: LocalPlanEntry[] = [];
    for (const weekEntries of Object.values(plans)) {
      if (Array.isArray(weekEntries)) {
        allAssignments.push(...weekEntries);
      }
    }

    const ingredients = allAssignments.flatMap((assignment) => {
      const meal = meals.find((m) => m.id === assignment.mealId);
      return meal?.ingredients ?? [];
    });

    const previousShoppingItems: LocalShoppingItem[] = [];
    for (const items of Object.values(shoppingByWeek)) {
      if (Array.isArray(items)) {
        previousShoppingItems.push(...items);
      }
    }

    let clearedKeys = new Set<string>();
    try {
      const raw = localStorage.getItem("hane-shopping:cleared_food_keys");
      if (raw) clearedKeys = new Set(JSON.parse(raw));
    } catch {
      // ignore
    }

    const built = buildShoppingItems(ingredients, previousShoppingItems);
    setFoodItems(built.filter((item) => !clearedKeys.has(item.key)));
  };

  useEffect(() => {
    refreshCustomItems();
    refreshFoodItems();

    const handleShoppingUpdate = () => {
      refreshCustomItems();
      refreshFoodItems();
    };
    const handleDinnerUpdate = () => {
      refreshFoodItems();
    };

    window.addEventListener("hane-shopping:updated", handleShoppingUpdate);
    window.addEventListener("hane-dinner:storage", handleDinnerUpdate);
    window.addEventListener("storage", handleShoppingUpdate);

    return () => {
      window.removeEventListener("hane-shopping:updated", handleShoppingUpdate);
      window.removeEventListener("hane-dinner:storage", handleDinnerUpdate);
      window.removeEventListener("storage", handleShoppingUpdate);
    };
  }, []);

  const customCompleted = useMemo(
    () => customItems.filter((i) => i.isCompleted).length,
    [customItems]
  );
  const foodCompleted = useMemo(
    () => foodItems.filter((i) => i.isCompleted).length,
    [foodItems]
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        badge="Hane Alışveriş"
        icon={<ShoppingBagIcon className="h-3.5 w-3.5" />}
        title="Ev & Mutfak Alışveriş Listesi"
        subtitle="Genel ev ihtiyaçlarını ve yemek planı malzemelerini tek merkezden yönetin."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(true)}
              className="secondary-button h-10 px-3 text-xs text-success border-success-border bg-success-bg hover:opacity-90"
              title="Tüm listeyi WhatsApp ile paylaş"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-success" />
              <span>WhatsApp İle Paylaş</span>
            </button>

            <div className="inline-flex items-center rounded-xl border border-border bg-surface p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeTab === "custom"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <ShoppingBagIcon className="h-4 w-4" />
                <span>Genel Alışveriş</span>
                {customItems.length > 0 && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                      activeTab === "custom"
                        ? "bg-white/20 text-white"
                        : "bg-surface-raised text-muted"
                    }`}
                  >
                    {customCompleted}/{customItems.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("food")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeTab === "food"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <UtensilsIcon className="h-4 w-4" />
                <span>Yemek Malzemeleri</span>
                {foodItems.length > 0 && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                      activeTab === "food"
                        ? "bg-white/20 text-white"
                        : "bg-surface-raised text-muted"
                    }`}
                  >
                    {foodCompleted}/{foodItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        }
      />

      {/* Tab Contents */}
      {activeTab === "custom" ? (
        <CustomShoppingList
          items={customItems}
          onRefresh={refreshCustomItems}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        />
      ) : (
        <FoodShoppingSyncList
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        />
      )}

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        customItems={customItems}
        foodItems={foodItems}
      />
    </div>
  );
}

export default function ShoppingPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-raised border border-border" />}>
      <ShoppingContent />
    </Suspense>
  );
}
