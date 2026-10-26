"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AIFoodAnalysisResult,
  FoodItem,
  MealType,
  SavedMealTemplate,
  SavedFoodItem,
  HistoryFoodItem,
} from "@/domain/calorieTypes";
import {
  getStoredGeminiApiKey,
  getSavedTemplates,
  deleteMealTemplate,
  getSavedFoods,
  deleteSavedFood,
  saveFoodItem,
  toggleSavedFood,
  getFoodHistory,
  deleteFromFoodHistory,
} from "@/storage/calorieStorage";

interface AddMealModalProps {
  isOpen: boolean;
  initialMealType?: MealType;
  onClose: () => void;
  onAddItems: (items: Omit<FoodItem, "id" | "createdAt">[]) => void;
  onOpenApiKeyModal: () => void;
}

const QUICK_PROMPTS = [
  "2 haşlanmış yumurta, 5 zeytin, 1 dilim tam buğday ekmeği",
  "1 porsiyon ızgara tavuk göğsü, 4 kaşık bulgur pilavı, 1 kase mevsim salatası",
  "1 tabak etli kuru fasulye, 3 kaşık pirinç pilavı ve 1 bardak ayran",
  "1 fincan filtre kahve ve 1 avuç çiğ badem",
];

const MEAL_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Kahvaltı", icon: "🌅" },
  { type: "lunch", label: "Öğle Yemeği", icon: "☀️" },
  { type: "dinner", label: "Akşam Yemeği", icon: "🌙" },
  { type: "snack", label: "Ara Öğün", icon: "🍎" },
];

export function AddMealModal({
  isOpen,
  initialMealType = "lunch",
  onClose,
  onAddItems,
  onOpenApiKeyModal,
}: AddMealModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "saved" | "manual">("ai");

  // AI Tab State
  const [promptText, setPromptText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIFoodAnalysisResult | null>(null);
  const [modelUsedInfo, setModelUsedInfo] = useState<{ name: string; isLite: boolean } | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType);
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

  // External AI / Emergency Fallback State
  const [isManualAiModalOpen, setIsManualAiModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pastedAiResponse, setPastedAiResponse] = useState("");
  const [manualAiParseError, setManualAiParseError] = useState<string | null>(null);

  // Saved / Favorites / History Tab State
  const [savedTemplates, setSavedTemplates] = useState<SavedMealTemplate[]>([]);
  const [savedFoods, setSavedFoods] = useState<SavedFoodItem[]>([]);
  const [foodHistory, setFoodHistory] = useState<HistoryFoodItem[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [savedSubTab, setSavedSubTab] = useState<"history" | "favorites" | "templates">("history");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetMealType, setTargetMealType] = useState<MealType>(initialMealType);
  const [isAddingNewFood, setIsAddingNewFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodPortion, setNewFoodPortion] = useState("1 porsiyon");
  const [newFoodCalories, setNewFoodCalories] = useState("");
  const [newFoodProtein, setNewFoodProtein] = useState("");
  const [newFoodCarbs, setNewFoodCarbs] = useState("");
  const [newFoodFat, setNewFoodFat] = useState("");

  // Manual Tab State
  const [manualMealType, setManualMealType] = useState<MealType>(initialMealType);
  const [manualName, setManualName] = useState("");
  const [manualPortion, setManualPortion] = useState("1 porsiyon");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedMealType(initialMealType);
      setManualMealType(initialMealType);
      setTargetMealType(initialMealType);
      refreshSavedLists();
    }
  }, [isOpen, initialMealType]);

  const refreshSavedLists = () => {
    setSavedTemplates(getSavedTemplates());
    setSavedFoods(getSavedFoods());
    setFoodHistory(getFoodHistory());
  };

  const filteredHistory = useMemo(() => {
    if (!historySearchQuery.trim()) return foodHistory;
    const q = historySearchQuery.trim().toLowerCase();
    return foodHistory.filter((item) => item.name.toLowerCase().includes(q));
  }, [foodHistory, historySearchQuery]);

  const matchingSuggestions = useMemo(() => {
    if (!manualName.trim() || manualName.trim().length < 2) return [];
    const q = manualName.trim().toLowerCase();
    return foodHistory.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 5);
  }, [manualName, foodHistory]);

  const handleSelectSuggestion = (suggestion: HistoryFoodItem) => {
    setManualName(suggestion.name);
    setManualPortion(suggestion.portion || "1 porsiyon");
    setManualCalories(String(suggestion.calories));
    setManualProtein(String(suggestion.protein));
    setManualCarbs(String(suggestion.carbs));
    setManualFat(String(suggestion.fat));
    setShowSuggestions(false);
  };

  const handleAddFromHistory = (item: HistoryFoodItem) => {
    onAddItems([
      {
        name: item.name,
        portion: item.portion,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        mealType: targetMealType,
        source: "manual",
      },
    ]);
    resetAndClose();
  };

  const handleToggleFavoriteFromHistory = (item: HistoryFoodItem) => {
    toggleSavedFood({
      name: item.name,
      portion: item.portion,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    });
    refreshSavedLists();
  };

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!promptText.trim()) return;

    setIsAnalyzing(true);
    setAiError(null);
    setAnalysisResult(null);

    try {
      const storedKey = getStoredGeminiApiKey();

      const res = await fetch("/api/calorie-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: promptText,
          apiKey: storedKey || undefined,
        }),
        signal: AbortSignal.timeout(55000),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.missingApiKey) {
          setAiError(
            "Gemini API anahtarı ayarlanmamış. Lütfen aşağıdaki butondan anahtarınızı kaydedin."
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
        setSelectedMealType(initialMealType || resObj.suggestedMealType);
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

  const getExternalPromptText = () => {
    const meal = promptText.trim() || "[Buraya yediğiniz yemeği yazın]";
    return `Sen uzman bir beslenme analisti ve diyetisyensin. Aşağıdaki yemeği analiz et ve SADECE aşağıdaki JSON formatında yanıt ver (başında veya sonunda hiçbir ek selamlama veya açıklama yazma, sadece saf JSON olsun):

{
  "suggestedMealType": "${initialMealType || "lunch"}",
  "items": [
    {
      "name": "Yemek adı",
      "portion": "1 porsiyon (150g)",
      "calories": 250,
      "protein": 18,
      "carbs": 25,
      "fat": 8
    }
  ],
  "note": "Kısa beslenme tavsiyesi"
}

Kullanıcının Yediği Yemek:
"${meal}"`;
  };

  const handleCopyExternalPrompt = () => {
    const text = getExternalPromptText();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  const handleParseAndImportExternalAi = () => {
    if (!pastedAiResponse.trim()) return;

    try {
      let cleaned = pastedAiResponse.trim();
      if (cleaned.includes("```")) {
        const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          cleaned = match[1].trim();
        }
      }

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleaned);

      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        setManualAiParseError("Geçerli bir besin listesi ('items') bulunamadı. Lütfen yapay zekanın tam çıktısını yapıştırdığınızdan emin olun.");
        return;
      }

      const validMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
      const suggestedMealType: MealType = validMealTypes.includes(parsed.suggestedMealType)
        ? parsed.suggestedMealType
        : initialMealType;

      const items = parsed.items.map((i: { name?: unknown; portion?: unknown; calories?: unknown; protein?: unknown; carbs?: unknown; fat?: unknown }) => ({
        name: String(i.name || "Bilinmeyen Yemek"),
        portion: String(i.portion || "1 porsiyon"),
        calories: Math.max(0, Math.round(Number(i.calories) || 0)),
        protein: Math.max(0, Math.round(Number(i.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(i.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(i.fat) || 0)),
      }));

      const totalCalories = items.reduce((sum: number, i: { calories: number }) => sum + i.calories, 0);
      const totalProtein = items.reduce((sum: number, i: { protein: number }) => sum + i.protein, 0);
      const totalCarbs = items.reduce((sum: number, i: { carbs: number }) => sum + i.carbs, 0);
      const totalFat = items.reduce((sum: number, i: { fat: number }) => sum + i.fat, 0);

      setAnalysisResult({
        suggestedMealType,
        items,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        note: parsed.note || "Harici yapay zeka ile aktarıldı.",
      });

      setModelUsedInfo({ name: "Harici Yapay Zeka (ChatGPT / Claude)", isLite: false });
      setSelectedMealType(suggestedMealType);
      setEditableItems(items);
      setIsManualAiModalOpen(false);
      setPastedAiResponse("");
      setManualAiParseError(null);
      setAiError(null);
    } catch {
      setManualAiParseError("Metin JSON olarak okunamadı. Lütfen çıktıyı kontrol edip tekrar yapıştırın.");
    }
  };

  const handleSaveAiItems = () => {
    if (editableItems.length === 0) return;

    const itemsToAdd: Omit<FoodItem, "id" | "createdAt">[] = editableItems.map(
      (item) => ({
        name: item.name,
        portion: item.portion,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        mealType: selectedMealType,
        source: "ai",
      })
    );

    onAddItems(itemsToAdd);
    resetAndClose();
  };

  const handleAddTemplate = (tpl: SavedMealTemplate) => {
    const itemsToAdd: Omit<FoodItem, "id" | "createdAt">[] = tpl.items.map((i) => ({
      ...i,
      mealType: targetMealType,
      source: "manual",
    }));

    onAddItems(itemsToAdd);
    resetAndClose();
  };

  const handleAddSingleSavedFood = (food: SavedFoodItem) => {
    const itemToAdd: Omit<FoodItem, "id" | "createdAt"> = {
      name: food.name,
      portion: food.portion,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      mealType: targetMealType,
      source: "manual",
    };

    onAddItems([itemToAdd]);
    resetAndClose();
  };

  const handleCreateNewSavedFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim() || !newFoodCalories) return;

    saveFoodItem({
      name: newFoodName.trim(),
      portion: newFoodPortion.trim() || "1 porsiyon",
      calories: Math.max(0, parseInt(newFoodCalories, 10) || 0),
      protein: Math.max(0, parseFloat(newFoodProtein) || 0),
      carbs: Math.max(0, parseFloat(newFoodCarbs) || 0),
      fat: Math.max(0, parseFloat(newFoodFat) || 0),
    });

    setNewFoodName("");
    setNewFoodCalories("");
    setNewFoodProtein("");
    setNewFoodCarbs("");
    setNewFoodFat("");
    setIsAddingNewFood(false);
    refreshSavedLists();
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualCalories) return;

    const newItem: Omit<FoodItem, "id" | "createdAt"> = {
      name: manualName.trim(),
      portion: manualPortion.trim() || "1 porsiyon",
      calories: Math.max(0, parseInt(manualCalories, 10) || 0),
      protein: Math.max(0, parseFloat(manualProtein) || 0),
      carbs: Math.max(0, parseFloat(manualCarbs) || 0),
      fat: Math.max(0, parseFloat(manualFat) || 0),
      mealType: manualMealType,
      source: "manual",
    };

    onAddItems([newItem]);
    resetAndClose();
  };

  const resetAndClose = () => {
    setPromptText("");
    setAnalysisResult(null);
    setAiError(null);
    setEditableItems([]);
    setManualName("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setIsAddingNewFood(false);
    setModelUsedInfo(null);
    setIsManualAiModalOpen(false);
    setPastedAiResponse("");
    setManualAiParseError(null);
    onClose();
  };

  const handleItemFieldChange = (
    index: number,
    field: "name" | "portion" | "calories" | "protein" | "carbs" | "fat",
    value: string
  ) => {
    setEditableItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      if (field === "name" || field === "portion") {
        target[field] = value;
      } else {
        const num = parseFloat(value) || 0;
        target[field] = num;
      }
      copy[index] = target;
      return copy;
    });
  };

  const handleRemoveEditableItem = (index: number) => {
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
  };

  const currentTotalCalories = editableItems.reduce(
    (sum, i) => sum + (Number(i.calories) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-xl rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-primary/20 text-lg shadow-2xs">
              🍽️
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">Öğün Ekle</h2>
              <p className="text-xs text-muted">
                Yapay zeka ile hesaplatın, kayıtlı şablonlarınızdan seçin veya elle girin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 3-Tab Switcher */}
        <div className="flex rounded-2xl bg-surface-raised p-1 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "ai"
                ? "bg-surface text-primary shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>🤖</span>
            <span>Yapay Zeka</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "saved"
                ? "bg-surface text-amber-500 shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>⭐</span>
            <span>Kaydedilenler</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "manual"
                ? "bg-surface text-primary shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>✍️</span>
            <span>Manuel</span>
          </button>
        </div>

        {/* ================= TAB 1: AI ================= */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Ne yedin? Doğal dille açıkla:</span>
                <span className="text-[11px] text-muted font-normal">
                  Türkçe serbest metin
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Örn: Öğle yemeğinde 1 porsiyon tavuk sote, 4 kaşık bulgur pilavı ve 1 bardak ayran içtim."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface-raised p-3.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none transition resize-none"
              />
            </div>

            {/* Quick Prompt Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted">Hızlı Örnekler:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPromptText(qp)}
                    className="rounded-xl border border-border/80 bg-surface-raised/60 hover:bg-surface-raised px-2.5 py-1 text-[11px] text-muted hover:text-foreground transition cursor-pointer truncate max-w-full"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500 space-y-2">
                <div className="font-semibold">{aiError}</div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {aiError.includes("API") && (
                    <button
                      type="button"
                      onClick={() => {
                        resetAndClose();
                        onOpenApiKeyModal();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-600 transition cursor-pointer"
                    >
                      <span>🔑</span>
                      <span>API Anahtarını Gir</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsManualAiModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 transition cursor-pointer"
                  >
                    <span>🚨</span>
                    <span>Harici Yapay Zeka ile Devam Et (ChatGPT / Claude)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Button & Alarm Fallback Button */}
            {!analysisResult && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAnalyzing || !promptText.trim()}
                  onClick={handleAnalyze}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-primary py-3 text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Yapay Zeka Analiz Ediyor...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Yapay Zeka ile Analiz Et & Hesapla</span>
                    </>
                  )}
                </button>

                {/* Alarm / Harici Yapay Zeka Kurtarma Butonu */}
                <button
                  type="button"
                  onClick={() => setIsManualAiModalOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 hover:border-amber-500/60 transition cursor-pointer shadow-xs shrink-0"
                  title="Yapay zeka çalışmazsa: Harici yapay zeka (ChatGPT / Claude / Gemini Web) promptu al ve sonucu yapıştır"
                  aria-label="Harici Yapay Zeka Kurtarma Modu"
                >
                  <span className="text-lg">🚨</span>
                </button>
              </div>
            )}

            {/* Analysis Result Preview Card */}
            {analysisResult && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>✓</span> Analiz Tamamlandı: {currentTotalCalories} kcal
                    {modelUsedInfo?.name && (
                      <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        ⚡ {modelUsedInfo.name}
                      </span>
                    )}
                  </div>

                  {/* Meal Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted">Öğün:</span>
                    <select
                      value={selectedMealType}
                      onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                      className="rounded-xl border border-border bg-surface px-2 py-1 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                    >
                      {MEAL_OPTIONS.map((m) => (
                        <option key={m.type} value={m.type}>
                          {m.icon} {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Editable Items */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editableItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/80 bg-surface p-2.5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemFieldChange(idx, "name", e.target.value)}
                          className="font-bold text-foreground bg-transparent flex-1 focus:outline-none"
                          placeholder="Yemek adı"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditableItem(idx)}
                          className="text-muted hover:text-rose-500 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                        <div>
                          <label className="text-muted block text-[10px]">Porsiyon</label>
                          <input
                            type="text"
                            value={item.portion}
                            onChange={(e) => handleItemFieldChange(idx, "portion", e.target.value)}
                            className="w-full rounded-lg bg-surface-raised border border-border/60 px-1.5 py-0.5 text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-muted block text-[10px]">Kalori (kcal)</label>
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => handleItemFieldChange(idx, "calories", e.target.value)}
                            className="w-full rounded-lg bg-surface-raised border border-border/60 px-1.5 py-0.5 text-foreground font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-muted block text-[10px]">Protein (g)</label>
                          <input
                            type="number"
                            value={item.protein}
                            onChange={(e) => handleItemFieldChange(idx, "protein", e.target.value)}
                            className="w-full rounded-lg bg-surface-raised border border-border/60 px-1.5 py-0.5 text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-muted block text-[10px]">Karb/Yağ (g)</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              title="Karbonhidrat"
                              value={item.carbs}
                              onChange={(e) => handleItemFieldChange(idx, "carbs", e.target.value)}
                              className="w-1/2 rounded-lg bg-surface-raised border border-border/60 px-1 py-0.5 text-foreground"
                            />
                            <input
                              type="number"
                              title="Yağ"
                              value={item.fat}
                              onChange={(e) => handleItemFieldChange(idx, "fat", e.target.value)}
                              className="w-1/2 rounded-lg bg-surface-raised border border-border/60 px-1 py-0.5 text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {analysisResult.note && (
                  <p className="text-[11px] text-muted italic">
                    💡 {analysisResult.note}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisResult(null)}
                    className="text-xs text-muted hover:text-foreground font-semibold cursor-pointer"
                  >
                    ← Yeniden Yaz
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAiItems}
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition cursor-pointer"
                  >
                    Öğünü Günlüğe Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: SAVED TEMPLATES & FOODS ================= */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {/* Target Meal Type Selector */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-raised border border-border/60">
              <span className="text-xs font-bold text-foreground">Hangi Öğüne Eklensin?</span>
              <div className="flex gap-1">
                {MEAL_OPTIONS.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setTargetMealType(m.type)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      targetMealType === m.type
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Tab Selector */}
            <div className="flex gap-1.5 p-1 rounded-2xl bg-surface-raised border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setSavedSubTab("history")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedSubTab === "history"
                    ? "bg-surface text-primary shadow-xs border border-border/80"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>📚</span>
                <span>Besin Geçmişi / DB</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                  {foodHistory.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSavedSubTab("favorites")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedSubTab === "favorites"
                    ? "bg-surface text-amber-500 shadow-xs border border-border/80"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>⭐</span>
                <span>Favoriler</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500">
                  {savedFoods.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSavedSubTab("templates")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedSubTab === "templates"
                    ? "bg-surface text-primary shadow-xs border border-border/80"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>📋</span>
                <span>Şablonlar</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted/20 text-muted">
                  {savedTemplates.length}
                </span>
              </button>
            </div>

            {/* SUB-TAB 1: FOOD HISTORY / DB */}
            {savedSubTab === "history" && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Geçmiş besinlerde ara (örn: yumurta, tavuk, pilav)..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface-raised pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-muted">🔍</span>
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery("")}
                      className="absolute right-3 top-2 text-xs text-muted hover:text-foreground cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* History List */}
                {filteredHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted space-y-1">
                    <span className="text-2xl block">🥗</span>
                    <p className="font-semibold text-foreground">
                      {historySearchQuery ? "Aramanıza uygun besin bulunamadı." : "Henüz besin geçmişi oluşmadı."}
                    </p>
                    <p className="text-[11px] text-muted">
                      Günlüğe eklediğiniz her yiyecek otomatik olarak buraya kaydedilip kişisel besin kütüphanenizi oluşturur (0 token ile tekrar kullanılabilir).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {filteredHistory.map((item) => {
                      const isStarred = savedFoods.some(
                        (sf) => sf.name.trim().toLowerCase() === item.name.trim().toLowerCase()
                      );
                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-border/80 bg-surface-raised/60 p-3 flex items-center justify-between hover:bg-surface-raised transition text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground truncate">{item.name}</span>
                              {item.useCount > 1 && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-orange-500/15 text-orange-500 border border-orange-500/20 shrink-0">
                                  🔥 {item.useCount}x
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted mt-0.5">
                              {item.portion} • <b className="text-foreground">{item.calories} kcal</b> • P:{item.protein}g K:{item.carbs}g Y:{item.fat}g
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Star to Favorite */}
                            <button
                              type="button"
                              onClick={() => handleToggleFavoriteFromHistory(item)}
                              className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs transition cursor-pointer ${
                                isStarred
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                                  : "bg-surface border-border text-muted hover:text-amber-500 hover:border-amber-500/30"
                              }`}
                              title={isStarred ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                            >
                              {isStarred ? "★" : "☆"}
                            </button>

                            {/* Add to Meal */}
                            <button
                              type="button"
                              onClick={() => handleAddFromHistory(item)}
                              className="rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                            >
                              + Ekle
                            </button>

                            {/* Delete from DB */}
                            <button
                              type="button"
                              onClick={() => {
                                deleteFromFoodHistory(item.id);
                                refreshSavedLists();
                              }}
                              className="text-muted hover:text-rose-500 text-xs px-1 cursor-pointer"
                              title="Geçmişten Sil"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: SAVED SINGLE FOODS (FAVORITES) */}
            {savedSubTab === "favorites" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    ⭐ Favori Tekil Besinlerim
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewFood(!isAddingNewFood)}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {isAddingNewFood ? "Kapat" : "+ Yeni Besin Ekle"}
                  </button>
                </div>

                {/* Form to add a new favorite food */}
                {isAddingNewFood && (
                  <form
                    onSubmit={handleCreateNewSavedFood}
                    className="rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-2 text-xs"
                  >
                    <div className="font-bold text-foreground text-xs">Yeni Sık Kullanılan Besin</div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Besin Adı (örn: Haşlanmış Yumurta)"
                        value={newFoodName}
                        onChange={(e) => setNewFoodName(e.target.value)}
                        className="col-span-2 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-foreground"
                      />
                      <input
                        type="text"
                        placeholder="Porsiyon (örn: 1 adet)"
                        value={newFoodPortion}
                        onChange={(e) => setNewFoodPortion(e.target.value)}
                        className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        required
                        placeholder="Kalori *"
                        value={newFoodCalories}
                        onChange={(e) => setNewFoodCalories(e.target.value)}
                        className="rounded-xl border border-border bg-surface px-2 py-1 text-foreground font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Protein (g)"
                        value={newFoodProtein}
                        onChange={(e) => setNewFoodProtein(e.target.value)}
                        className="rounded-xl border border-border bg-surface px-2 py-1 text-foreground"
                      />
                      <input
                        type="number"
                        placeholder="Karb (g)"
                        value={newFoodCarbs}
                        onChange={(e) => setNewFoodCarbs(e.target.value)}
                        className="rounded-xl border border-border bg-surface px-2 py-1 text-foreground"
                      />
                      <input
                        type="number"
                        placeholder="Yağ (g)"
                        value={newFoodFat}
                        onChange={(e) => setNewFoodFat(e.target.value)}
                        className="rounded-xl border border-border bg-surface px-2 py-1 text-foreground"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewFood(false)}
                        className="px-3 py-1 rounded-lg text-muted hover:text-foreground"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-primary px-3 py-1 font-bold text-white shadow-xs"
                      >
                        Kaydet
                      </button>
                    </div>
                  </form>
                )}

                {savedFoods.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted">
                    Henüz favori tekil besin eklemediniz.
                    <p className="text-[10px] text-muted/80 mt-0.5">
                      Yemeklerin yanındaki ⭐ butonuna veya Besin Geçmişi listesindeki yıldızlara basarak sık tükettiğiniz yiyecekleri buraya kaydedebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {savedFoods.map((food) => (
                      <div
                        key={food.id}
                        className="rounded-2xl border border-border/80 bg-surface-raised/60 p-2.5 flex items-center justify-between hover:bg-surface-raised transition text-xs"
                      >
                        <div className="min-w-0 pr-1.5">
                          <span className="font-bold text-foreground block truncate">
                            {food.name}
                          </span>
                          <span className="text-[10px] text-muted block">
                            {food.portion} • <b className="text-foreground">{food.calories} kcal</b>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddSingleSavedFood(food)}
                            className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white px-2 py-1 text-[11px] font-bold transition cursor-pointer"
                          >
                            + Ekle
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteSavedFood(food.id);
                              refreshSavedLists();
                            }}
                            className="text-muted hover:text-rose-500 text-xs px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: SAVED MEAL TEMPLATES */}
            {savedSubTab === "templates" && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>📋 Kayıtlı Öğün Şablonlarım (Tüm Menü)</span>
                  <span className="text-[10px] text-muted">0 Token Harcar</span>
                </span>

                {savedTemplates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted">
                    Henüz kaydedilmiş öğün şablonunuz yok.
                    <p className="text-[10px] text-muted/80 mt-1">
                      Günün öğünleri kartlarındaki &quot;💾 Öğünü Kaydet&quot; butonuna basarak sık yediğiniz menüleri kaydedebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {savedTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="rounded-2xl border border-border/80 bg-surface-raised/60 p-3 flex items-center justify-between hover:bg-surface-raised transition"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {tpl.title}
                            </span>
                            <span className="text-[10px] text-muted">
                              ({tpl.items.length} yiyecek)
                            </span>
                          </div>
                          <div className="text-[11px] text-muted mt-0.5">
                            <b className="text-foreground">{tpl.totalCalories} kcal</b> • P:{tpl.totalProtein}g K:{tpl.totalCarbs}g Y:{tpl.totalFat}g
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddTemplate(tpl)}
                            className="rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                          >
                            + Ekle
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteMealTemplate(tpl.id);
                              refreshSavedLists();
                            }}
                            className="text-muted hover:text-rose-500 text-xs px-1 cursor-pointer"
                            title="Şablonu Sil"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: MANUAL ================= */}
        {activeTab === "manual" && (
          <form onSubmit={handleSaveManual} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Öğün</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MEAL_OPTIONS.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setManualMealType(m.type)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition cursor-pointer ${
                      manualMealType === m.type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-raised text-muted hover:text-foreground"
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Yemek Adı</span>
                {matchingSuggestions.length > 0 && (
                  <span className="text-[10px] text-primary font-medium">
                    💡 Veritabanından {matchingSuggestions.length} öneri bulundu
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Mercimek Çorbası"
                value={manualName}
                onChange={(e) => {
                  setManualName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full rounded-2xl border border-border bg-surface-raised px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && matchingSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-2xl border border-primary/30 bg-surface shadow-xl overflow-hidden divide-y divide-border/60 max-h-48 overflow-y-auto">
                  {matchingSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-surface-raised transition text-left cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-foreground block truncate">{sug.name}</span>
                        <span className="text-[10px] text-muted block truncate">
                          {sug.portion} • {sug.calories} kcal • P:{sug.protein}g K:{sug.carbs}g Y:{sug.fat}g
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded-lg">
                        Doldur ↵
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Porsiyon</label>
                <input
                  type="text"
                  placeholder="Örn: 1 kase (200ml)"
                  value={manualPortion}
                  onChange={(e) => setManualPortion(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface-raised px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Kalori (kcal) *</label>
                <input
                  type="number"
                  required
                  placeholder="Örn: 180"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface-raised px-3.5 py-2.5 text-xs text-foreground font-bold focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted">Protein (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-raised px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted">Karb (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-raised px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted">Yağ (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={manualFat}
                  onChange={(e) => setManualFat(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-raised px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ================= MODAL: EXTERNAL AI / ALARM FALLBACK ================= */}
      {isManualAiModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-lg">
                  🚨
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Harici Yapay Zeka Kurtarma Modu
                  </h3>
                  <p className="text-[11px] text-muted">
                    ChatGPT, Claude veya Gemini Web kullanarak öğünü analiz edin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManualAiModalOpen(false);
                  setManualAiParseError(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Copy Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-black">
                    1
                  </span>
                  <span>Bu Promptu Kopyalayın:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyExternalPrompt}
                  className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <span>{copiedPrompt ? "✓" : "📋"}</span>
                  <span>{copiedPrompt ? "Kopyalandı!" : "Promptu Kopyala"}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={6}
                  readOnly
                  value={getExternalPromptText()}
                  className="w-full font-mono text-[11px] rounded-2xl border border-border bg-surface-raised/80 p-3 text-muted select-all focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Quick AI Links */}
              <div className="flex items-center gap-2 text-[11px] text-muted pt-0.5">
                <span className="font-semibold text-foreground/80">Kestirme:</span>
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2 py-0.5 bg-surface-raised border border-border/80 hover:border-foreground/30 text-foreground/90 font-medium hover:text-primary transition inline-flex items-center gap-1"
                >
                  <span>🟢</span> ChatGPT
                </a>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2 py-0.5 bg-surface-raised border border-border/80 hover:border-foreground/30 text-foreground/90 font-medium hover:text-primary transition inline-flex items-center gap-1"
                >
                  <span>✨</span> Gemini Web
                </a>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2 py-0.5 bg-surface-raised border border-border/80 hover:border-foreground/30 text-foreground/90 font-medium hover:text-primary transition inline-flex items-center gap-1"
                >
                  <span>🟠</span> Claude
                </a>
              </div>
            </div>

            {/* Step 2: Paste Response */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black">
                  2
                </span>
                <span>Yapay Zekadan Gelen Yanıtı Buraya Yapıştırın:</span>
              </span>

              <textarea
                rows={5}
                placeholder={`Yapay zekanın verdiği JSON çıktısını buraya yapıştırın...\nÖrnek:\n{\n  "suggestedMealType": "lunch",\n  "items": [\n    { "name": "Tavuk Pilav", "calories": 450, "protein": 30, "carbs": 40, "fat": 12 }\n  ]\n}`}
                value={pastedAiResponse}
                onChange={(e) => {
                  setPastedAiResponse(e.target.value);
                  setManualAiParseError(null);
                }}
                className="w-full font-mono text-[11px] rounded-2xl border border-border bg-surface-raised p-3 text-foreground placeholder:text-muted/50 focus:border-emerald-500 focus:outline-none transition resize-none leading-relaxed"
              />

              {manualAiParseError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-500">
                  ⚠️ {manualAiParseError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualAiModalOpen(false);
                    setManualAiParseError(null);
                  }}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={!pastedAiResponse.trim()}
                  onClick={handleParseAndImportExternalAi}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Yanıtı İçe Aktar & Düzenle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
