"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addWeeks, getCurrentWeekStart, getValidWeekStart } from "@/lib/date/week";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "@/components/ui/Icons";
import { CustomShoppingList } from "@/components/shopping/CustomShoppingList";
import { FoodShoppingSyncList } from "@/components/shopping/FoodShoppingSyncList";
import { WhatsAppShareModal } from "@/components/shopping/WhatsAppShareModal";
import { getWeekCustomShopping } from "@/storage/shoppingStorage";
import { readStorage, STORAGE_KEYS, type LocalShoppingItem } from "@/lib/local-storage/store";

function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

type ShoppingTab = "custom" | "food";

function ShoppingContent() {
  const searchParams = useSearchParams();
  const weekStart = getValidWeekStart(searchParams.get("week") ?? undefined);
  const weekEnd = addWeeks(weekStart, 1);
  const isCurrentWeek = weekStart === getCurrentWeekStart();

  const [activeTab, setActiveTab] = useState<ShoppingTab>("custom");
  const [customItems, setCustomItems] = useState(() => getWeekCustomShopping(weekStart));
  const [foodItems, setFoodItems] = useState<LocalShoppingItem[]>([]);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const refreshCustomItems = () => {
    setCustomItems(getWeekCustomShopping(weekStart));
  };

  const refreshFoodItems = () => {
    const shoppingByWeek = readStorage<Record<string, LocalShoppingItem[]>>(STORAGE_KEYS.shopping, {});
    setFoodItems(shoppingByWeek[weekStart] || []);
  };

  useEffect(() => {
    refreshCustomItems();
    refreshFoodItems();

    const handleShoppingUpdate = () => {
      refreshCustomItems();
    };
    const handleDinnerUpdate = () => {
      refreshFoodItems();
    };

    window.addEventListener("hane-shopping:updated", handleShoppingUpdate);
    window.addEventListener("hane-dinner:storage", handleDinnerUpdate);
    window.addEventListener("storage", () => {
      refreshCustomItems();
      refreshFoodItems();
    });

    return () => {
      window.removeEventListener("hane-shopping:updated", handleShoppingUpdate);
      window.removeEventListener("hane-dinner:storage", handleDinnerUpdate);
    };
  }, [weekStart]);

  const customCompleted = customItems.filter((i) => i.isCompleted).length;
  const foodCompleted = foodItems.filter((i) => i.isCompleted).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Week Navigation Header */}
      <nav
        aria-label="Haftalık Alışveriş Gezintisi"
        className="flex items-center justify-between rounded-3xl border border-border/80 bg-surface/80 p-3 shadow-xs backdrop-blur-md sm:p-4"
      >
        <Link
          href={`/shopping?week=${addWeeks(weekStart, -1)}`}
          className="secondary-button h-9 px-3 text-xs sm:text-sm"
          title="Önceki hafta"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Önceki Hafta</span>
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              {formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}
            </h1>
          </div>
          {!isCurrentWeek ? (
            <Link
              href="/shopping"
              className="mt-0.5 text-xs font-semibold text-primary hover:underline"
            >
              Şimdiki Haftaya Dön
            </Link>
          ) : (
            <span className="mt-0.5 text-[11px] font-medium text-muted">
              Mevcut Hafta
            </span>
          )}
        </div>

        <Link
          href={`/shopping?week=${addWeeks(weekStart, 1)}`}
          className="secondary-button h-9 px-3 text-xs sm:text-sm"
          title="Sonraki hafta"
        >
          <span className="hidden sm:inline">Sonraki Hafta</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </nav>

      {/* Hero Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface rounded-3xl border border-border/80 p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-primary uppercase tracking-wider mb-1">
            <span>🛒</span> Hane Shopping
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Haftalık Alışveriş & Gıda Yönetimi
          </h2>
          <p className="text-xs text-muted mt-1">
            Yemek malzemelerini ve genel ev alışverişlerinizi tek merkezden takip edin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1.5 rounded-2xl bg-surface-raised border border-border/70 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "custom"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>🛒</span>
              <span>Alışveriş</span>
              {customItems.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === "custom"
                      ? "bg-white/20 text-white"
                      : "bg-surface text-muted"
                  }`}
                >
                  {customCompleted}/{customItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("food")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "food"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>🍲</span>
              <span>Gıda</span>
              {foodItems.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === "food"
                      ? "bg-white/20 text-white"
                      : "bg-surface text-muted"
                  }`}
                >
                  {foodCompleted}/{foodItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

      {/* Tab Contents */}
      {activeTab === "custom" ? (
        <CustomShoppingList
          weekStart={weekStart}
          items={customItems}
          onRefresh={refreshCustomItems}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        />
      ) : (
        <FoodShoppingSyncList
          weekStart={weekStart}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        />
      )}

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        weekStart={weekStart}
        customItems={customItems}
        foodItems={foodItems}
      />
    </div>
  );
}

export default function ShoppingPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface-raised" />}>
      <ShoppingContent />
    </Suspense>
  );
}
