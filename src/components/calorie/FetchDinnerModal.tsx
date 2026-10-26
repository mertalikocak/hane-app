"use client";

import React, { useState, useEffect } from "react";
import { FoodItem, AIFoodAnalysisResult } from "@/domain/calorieTypes";
import {
  getAllDinnerMeals,
  getPlannedDinnerForDate,
  getStoredGeminiApiKey,
} from "@/storage/calorieStorage";
import type { LocalMeal } from "@/lib/local-storage/store";

interface FetchDinnerModalProps {
  isOpen: boolean;
  selectedDate: string;
  onClose: () => void;
  onAddItems: (items: Omit<FoodItem, "id" | "createdAt">[]) => void;
  onOpenApiKeyModal: () => void;
}

function getPortionedIngredientsList(
  meal: LocalMeal | undefined,
  consumed: number,
  total: number
): string {
  if (!meal) return "";
  const ratio = (consumed || 1) / (total || 1);
  if (meal.ingredients && meal.ingredients.length > 0) {
    const list = meal.ingredients.map((ing) => {
      const qty = Number(ing.quantity);
      if (!isNaN(qty) && qty > 0) {
        const scaled = Math.round(qty * ratio * 100) / 100;
        const formattedQty = Number.isInteger(scaled)
          ? String(scaled)
          : scaled.toFixed(2).replace(/\.?0+$/, "");
        return `${formattedQty} ${ing.unit || ""} ${ing.name}`.replace(/\s+/g, " ").trim();
      }
      return `${ing.quantity || ""} ${ing.unit || ""} ${ing.name}`.replace(/\s+/g, " ").trim();
    });
    return list.join(", ");
  }
  return `${consumed} porsiyon ${meal.name}`;
}

export function FetchDinnerModal({
  isOpen,
  selectedDate,
  onClose,
  onAddItems,
  onOpenApiKeyModal,
}: FetchDinnerModalProps) {
  const [allMeals, setAllMeals] = useState<LocalMeal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [totalPortions, setTotalPortions] = useState<number>(3);
  const [consumedPortions, setConsumedPortions] = useState<number>(1);
  const [customIngredients, setCustomIngredients] = useState<string>("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIFoodAnalysisResult | null>(null);
  const [modelUsedInfo, setModelUsedInfo] = useState<{ name: string; isLite: boolean } | null>(null);
  const [editableItems, setEditableItems] = useState<
    Array<{
      name: string;
      portion: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>
  >([]);

  useEffect(() => {
    if (isOpen) {
      const meals = getAllDinnerMeals();
      setAllMeals(meals);

      const planned = getPlannedDinnerForDate(selectedDate);
      let initialId = "";
      if (planned) {
        initialId = planned.id;
      } else if (meals.length > 0) {
        initialId = meals[0].id;
      }
      setSelectedMealId(initialId);

      const initialTotal = 3;
      const initialConsumed = 1;
      setTotalPortions(initialTotal);
      setConsumedPortions(initialConsumed);
      setAnalysisResult(null);
      setAiError(null);
      setEditableItems([]);

      const initialMeal = meals.find((m) => m.id === initialId);
      setCustomIngredients(getPortionedIngredientsList(initialMeal, initialConsumed, initialTotal));
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const currentMeal = allMeals.find((m) => m.id === selectedMealId);

  const rawIngredientsText =
    currentMeal?.ingredients && currentMeal.ingredients.length > 0
      ? currentMeal.ingredients
          .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`.trim())
          .join(", ")
      : "";

  const syncIngredients = (mealId: string, consumed: number, total: number) => {
    const meal = allMeals.find((m) => m.id === mealId);
    setCustomIngredients(getPortionedIngredientsList(meal, consumed, total));
  };

  const handleAnalyzeDinner = async () => {
    if (!currentMeal) return;

    setIsAnalyzing(true);
    setAiError(null);
    setAnalysisResult(null);

    // Kullanıcının düzenlediği veya eklemeler yaptığı malzeme listesini doğrudan gönderiyoruz
    const prompt = customIngredients.trim()
      ? customIngredients.trim()
      : `${consumedPortions} porsiyon ${currentMeal.name}`;

    try {
      const storedKey = getStoredGeminiApiKey();

      const res = await fetch("/api/calorie-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prompt,
          apiKey: storedKey || undefined,
        }),
        signal: AbortSignal.timeout(55000),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.missingApiKey) {
          setAiError(
            "Gemini API anahtarı ayarlanmamış. Lütfen anahtarınızı kaydedin."
          );
        } else {
          setAiError(data.error || "Yapay zeka analizinde bir hata oluştu.");
        }
        return;
      }

      if (data.result) {
        const resObj: AIFoodAnalysisResult = data.result;
        setAnalysisResult(resObj);
        setModelUsedInfo({ name: data.modelUsed, isLite: Boolean(data.isLite) });
        setEditableItems(resObj.items || []);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.toLowerCase().includes("timed out") ||
        (err as { name?: string })?.name === "AbortError"
      ) {
        setAiError(
          "İstek zaman aşımına uğradı. Gemini sunucusu yanıt vermedi, lütfen tekrar deneyin."
        );
      } else {
        setAiError(
          err instanceof Error ? err.message : "Bağlantı hatası meydana geldi."
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToDinner = () => {
    if (editableItems.length === 0 || !currentMeal) return;

    const itemsToAdd: Omit<FoodItem, "id" | "createdAt">[] = editableItems.map(
      (item) => ({
        name: item.name,
        portion: `${consumedPortions} porsiyon (toplam ${totalPortions}'den)`,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        mealType: "dinner",
        source: "dinner",
        dinnerMealId: currentMeal.id,
      })
    );

    onAddItems(itemsToAdd);
    onClose();
  };

  const ratioPercent = Math.min(
    100,
    Math.round((consumedPortions / (totalPortions || 1)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 text-lg shadow-2xs">
              🍽️
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Akşam Yemeğini Çek & Porsiyonla
              </h2>
              <p className="text-xs text-muted">
                Hane Dinner malzemelerini porsiyonunuza göre yapay zekaya hesaplatın
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        {allMeals.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-muted">
              Hane Dinner modülünde kayıtlı yemek bulunamadı.
            </p>
            <p className="text-[11px] text-muted/80">
              Yemek kataloğuna yemek ekledikten sonra buradan tek tıkla çekebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Meal Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Akşam Yemeği Seçin:</span>
                <span className="text-[10px] text-purple-500 font-semibold">
                  Hane Dinner Kataloğu
                </span>
              </label>
              <select
                value={selectedMealId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedMealId(newId);
                  setAnalysisResult(null);
                  syncIngredients(newId, consumedPortions, totalPortions);
                }}
                className="w-full rounded-2xl border border-border bg-surface-raised p-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                {allMeals.map((m) => (
                  <option key={m.id} value={m.id}>
                    🍲 {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Portion Controls */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border border-border bg-surface-raised/40">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Tencere Kaç Porsiyon?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={totalPortions}
                    onChange={(e) => {
                      const newTotal = Math.max(0.5, parseFloat(e.target.value) || 1);
                      setTotalPortions(newTotal);
                      setAnalysisResult(null);
                      syncIngredients(selectedMealId, consumedPortions, newTotal);
                    }}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                  />
                  <span className="text-xs text-muted font-medium">porsiyon</span>
                </div>
                <span className="text-[10px] text-muted">Toplam pişirilen miktar</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Siz Kaç Porsiyon Yediniz?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.25"
                    max="10"
                    step="0.25"
                    value={consumedPortions}
                    onChange={(e) => {
                      const newConsumed = Math.max(0.25, parseFloat(e.target.value) || 1);
                      setConsumedPortions(newConsumed);
                      setAnalysisResult(null);
                      syncIngredients(selectedMealId, newConsumed, totalPortions);
                    }}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
                  />
                  <span className="text-xs text-muted font-medium">porsiyon</span>
                </div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                  Tüm yemeğin %{ratioPercent}&apos;i
                </span>
              </div>
            </div>

            {/* Editable Portioned Ingredients Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>🥣</span>
                  <span>Yapay Zekaya Gönderilecek Malzemeler:</span>
                </label>
                <button
                  type="button"
                  onClick={() => syncIngredients(selectedMealId, consumedPortions, totalPortions)}
                  className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                  title="Porsiyona göre yeniden doldur"
                >
                  <span>↺</span>
                  <span>Porsiyona Göre Sıfırla</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={customIngredients}
                  onChange={(e) => {
                    setCustomIngredients(e.target.value);
                    setAnalysisResult(null);
                  }}
                  placeholder="Yapay zekaya gidecek porsiyonlanmış malzemeler..."
                  className="w-full rounded-2xl border border-purple-500/30 bg-surface-raised p-3 text-xs font-medium text-foreground focus:border-purple-500 focus:outline-none resize-none shadow-xs transition leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted px-1">
                <span>
                  💡 Düzenleyebilir veya yanına ekstra ekleyebilirsiniz (Örn: <i>+ 1 dilim ekmek, 1 kase yoğurt</i>).
                </span>
              </div>

              {/* Total Pot Recipe Reference */}
              {rawIngredientsText && (
                <div className="rounded-xl border border-border/60 bg-surface-raised/30 px-3 py-2 text-[10px] text-muted flex items-center justify-between gap-2">
                  <span className="font-medium shrink-0">Tencere toplam tarif ({totalPortions} kişilik):</span>
                  <span className="text-foreground/75 truncate" title={rawIngredientsText}>
                    {rawIngredientsText}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500 space-y-2">
                <div className="font-semibold">{aiError}</div>
                {aiError.includes("API") && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenApiKeyModal();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                  >
                    API Anahtarını Gir
                  </button>
                )}
              </div>
            )}

            {/* Calculate Button */}
            {!analysisResult && (
              <button
                type="button"
                disabled={isAnalyzing || !currentMeal}
                onClick={handleAnalyzeDinner}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-primary py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Porsiyonunuz Hesaplanıyor...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>{consumedPortions} Porsiyon İçin Kalori & Makro Hesapla</span>
                  </>
                )}
              </button>
            )}

            {/* Analysis Result Preview */}
            {analysisResult && (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      ✓ {currentMeal?.name} ({consumedPortions} Porsiyon)
                    </span>
                    {modelUsedInfo?.name && (
                      <span className="rounded-md bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-600 dark:text-purple-400">
                        ⚡ {modelUsedInfo.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black text-foreground">
                    {editableItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0)} kcal
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {editableItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/80 bg-surface p-2 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-foreground block">{item.name}</span>
                        <span className="text-[10px] text-muted">
                          P: {item.protein}g • K: {item.carbs}g • Y: {item.fat}g
                        </span>
                      </div>
                      <span className="font-bold text-foreground">{item.calories} kcal</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisResult(null)}
                    className="text-xs text-muted hover:text-foreground font-semibold cursor-pointer"
                  >
                    ← Porsiyonu Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToDinner}
                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition cursor-pointer"
                  >
                    Akşam Yemeğine Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
