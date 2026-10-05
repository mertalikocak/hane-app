"use client";

import React, { useState, useMemo } from "react";
import type { LocalShoppingItem, LocalMeal, LocalPlanEntry } from "@/lib/local-storage/store";
import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/local-storage/store";
import { buildShoppingItems } from "@/services/local-shopping";
import Link from "next/link";

interface FoodShoppingSyncListProps {
  weekStart: string;
}

export function FoodShoppingSyncList({ weekStart }: FoodShoppingSyncListProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Read dinner data from storage
  const [plans, setPlans] = useState<Record<string, LocalPlanEntry[]>>(() =>
    readStorage(STORAGE_KEYS.plans, {})
  );
  const [meals] = useState<LocalMeal[]>(() =>
    readStorage(STORAGE_KEYS.meals, [])
  );
  const [shoppingByWeek, setShoppingByWeek] = useState<Record<string, LocalShoppingItem[]>>(() =>
    readStorage(STORAGE_KEYS.shopping, {})
  );

  // Sync listener for storage changes across tabs or dinner page
  React.useEffect(() => {
    const handleSync = () => {
      setPlans(readStorage(STORAGE_KEYS.plans, {}));
      setShoppingByWeek(readStorage(STORAGE_KEYS.shopping, {}));
    };

    window.addEventListener("hane-dinner:storage", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("hane-dinner:storage", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const assignments = useMemo(() => plans[weekStart] ?? [], [plans, weekStart]);

  const ingredients = useMemo(
    () =>
      assignments.flatMap(
        (assignment) =>
          meals.find((meal) => meal.id === assignment.mealId)?.ingredients ?? []
      ),
    [assignments, meals]
  );

  const currentShopping = useMemo(
    () => shoppingByWeek[weekStart] ?? [],
    [shoppingByWeek, weekStart]
  );

  // Auto-build shopping items when dinner ingredients change
  React.useEffect(() => {
    const nextItems = buildShoppingItems(ingredients, currentShopping);
    const areEqual =
      nextItems.length === currentShopping.length &&
      nextItems.every((item, i) => {
        const cur = currentShopping[i];
        return (
          cur &&
          cur.key === item.key &&
          cur.quantity === item.quantity &&
          cur.unit === item.unit &&
          cur.isCompleted === item.isCompleted
        );
      });

    if (!areEqual) {
      const updated = { ...shoppingByWeek, [weekStart]: nextItems };
      setShoppingByWeek(updated);
      writeStorage(STORAGE_KEYS.shopping, updated);
    }
  }, [ingredients, currentShopping, shoppingByWeek, weekStart]);

  const toggleItem = (key: string, isCompleted: boolean) => {
    const updatedWeek = currentShopping.map((item) =>
      item.key === key ? { ...item, isCompleted } : item
    );
    const updatedAll = { ...shoppingByWeek, [weekStart]: updatedWeek };
    setShoppingByWeek(updatedAll);
    writeStorage(STORAGE_KEYS.shopping, updatedAll);
  };

  const completedCount = currentShopping.filter((i) => i.isCompleted).length;
  const uncompletedCount = currentShopping.length - completedCount;

  const sortedItems = useMemo(() => {
    const uncompleted = currentShopping.filter((item) => !item.isCompleted);
    const completed = currentShopping.filter((item) => item.isCompleted);
    return [...uncompleted, ...completed];
  }, [currentShopping]);

  const handleCopy = async () => {
    const uncompleted = currentShopping.filter((item) => !item.isCompleted);
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
      <div className="p-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 text-lg border border-emerald-500/25">
            🍲
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">Hane Dinner ile Tam Senkronize</h4>
            <p className="text-xs text-muted">
              Bu liste haftalık yemek planınızdaki tariflerin malzemelerinden otomatik derlenir. Buradaki işaretlemeler Hane Dinner ile eşzamanlıdır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dinner?week=${weekStart}`}
            className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition"
          >
            Yemek Planını Düzenle →
          </Link>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">
            {currentShopping.length > 0
              ? `${completedCount} / ${currentShopping.length} malzeme alındı`
              : "Malzeme Yok"}
          </span>
          {currentShopping.length > 0 && (
            <span className="text-[11px] text-muted">
              (%{Math.round((completedCount / currentShopping.length) * 100)})
            </span>
          )}
        </div>

        {currentShopping.length > 0 && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-raised hover:bg-border/40 text-xs font-semibold text-foreground transition cursor-pointer"
          >
            <span>{isCopied ? "✓" : "📋"}</span>
            <span>{isCopied ? "Kopyalandı!" : "Malzemeleri Kopyala"}</span>
          </button>
        )}
      </div>

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border/80 bg-surface/50 space-y-3">
          <span className="text-3xl sm:text-4xl block">🥗</span>
          <h4 className="text-base font-bold text-foreground">
            Bu hafta için yemek planı yapılmamış
          </h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Hane Dinner sayfasından bu haftaya yemekler atadığınızda, ihtiyaç duyulan tüm malzemeler otomatik olarak burada toplanacaktır.
          </p>
          <div className="pt-2">
            <Link
              href={`/dinner?week=${weekStart}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 transition"
            >
              Yemek Planına Git
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sortedItems.map((item) => (
            <div
              key={item.key}
              onClick={() => toggleItem(item.key, !item.isCompleted)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none group ${
                item.isCompleted
                  ? "bg-surface-raised/40 border-border/40 opacity-60"
                  : "bg-surface border-border/80 hover:border-emerald-500/40 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border text-xs transition ${
                    item.isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white font-bold"
                      : "border-border bg-surface group-hover:border-emerald-500/60"
                  }`}
                >
                  {item.isCompleted && "✓"}
                </div>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-sm font-bold truncate ${
                      item.isCompleted
                        ? "line-through text-muted"
                        : "text-foreground"
                    }`}
                  >
                    {item.ingredientName}
                  </span>
                  <span className="text-[11px] text-muted mt-0.5">
                    Miktar: <strong className="text-foreground/80">{item.quantity} {item.unit}</strong>
                  </span>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  item.isCompleted
                    ? "bg-surface-raised text-muted"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
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
