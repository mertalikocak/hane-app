"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AIFoodAnalysisResult,
  FoodItem,
  MealType,
  SavedMealTemplate,
  SavedFoodItem,
  HistoryFoodItem,
  SharedMeal,
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
  getSharedMeals,
  deleteSharedMeal,
  getAllCalorieRecords,
  calculateMacroSummary,
} from "@/storage/calorieStorage";
import { useProfile } from "@/context/ProfileContext";
import { CloseIcon } from "@/components/ui/Icons";

interface AddMealModalProps {
  isOpen: boolean;
  initialMealType?: MealType;
  selectedDate?: string;
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
  selectedDate,
  onClose,
  onAddItems,
  onOpenApiKeyModal,
}: AddMealModalProps) {
  const { profiles, activeProfileId } = useProfile();
  const [activeTab, setActiveTab] = useState<"ai" | "saved" | "manual" | "shared">("ai");
  const [sharedMeals, setSharedMeals] = useState<SharedMeal[]>([]);
  const [sharedTargetMealType, setSharedTargetMealType] = useState<MealType>(initialMealType);

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
      setSharedTargetMealType(initialMealType);
      refreshSavedLists();
    }
  }, [isOpen, initialMealType]);

  const refreshSavedLists = () => {
    setSavedTemplates(getSavedTemplates());
    setSavedFoods(getSavedFoods());
    setFoodHistory(getFoodHistory());
    setSharedMeals(getSharedMeals());
  };

  // Diğer kullanıcıların seçili günde girdiği öğünleri otomatik listele
  const otherProfilesDailyMeals = useMemo(() => {
    if (!isOpen) return [];
    const dateStr =
      selectedDate ||
      (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")}`;
      })();

    const allRecords = getAllCalorieRecords();
    const otherRecords = allRecords.filter(
      (r) => r.date === dateStr && r.profileId !== (activeProfileId || "default") && r.items.length > 0
    );

    const grouped: Array<{
      id: string;
      profileId: string;
      profileName: string;
      mealType: MealType;
      mealLabel: string;
      mealIcon: string;
      items: FoodItem[];
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
    }> = [];

    for (const rec of otherRecords) {
      const prof = profiles.find((p) => p.id === rec.profileId);
      const profileName = prof ? `${prof.firstName} ${prof.lastName}`.trim() : "Diğer Kullanıcı";

      for (const mOpt of MEAL_OPTIONS) {
        const mItems = rec.items.filter((i) => i.mealType === mOpt.type);
        if (mItems.length > 0) {
          const sum = calculateMacroSummary(mItems);
          grouped.push({
            id: `${rec.profileId}_${mOpt.type}`,
            profileId: rec.profileId,
            profileName,
            mealType: mOpt.type,
            mealLabel: mOpt.label,
            mealIcon: mOpt.icon,
            items: mItems,
            totalCalories: sum.calories,
            totalProtein: sum.protein,
            totalCarbs: sum.carbs,
            totalFat: sum.fat,
          });
        }
      }
    }

    return grouped;
  }, [isOpen, selectedDate, activeProfileId, profiles, sharedMeals]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-lg space-y-4 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/70 border border-border-lavender text-lg">
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
            className="icon-button h-8 w-8"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* 4-Tab Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-xl bg-surface-raised p-1 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "ai"
                ? "bg-surface text-primary shadow-2xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>🤖</span>
            <span>Yapay Zeka</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "saved"
                ? "bg-surface text-primary shadow-2xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>⭐</span>
            <span>Kaydedilenler</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "manual"
                ? "bg-surface text-primary shadow-2xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>✍️</span>
            <span>Manuel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shared")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "shared"
                ? "bg-surface text-primary shadow-2xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>🤝</span>
            <span>Paylaşılmış</span>
            {sharedMeals.length + otherProfilesDailyMeals.length > 0 && (
              <span className="ds-badge ds-badge-primary text-[9px] px-1.5 py-0">
                {sharedMeals.length + otherProfilesDailyMeals.length}
              </span>
            )}
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
                className="field min-h-[84px] py-2.5 resize-none"
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
                    className="rounded-lg border border-border bg-surface-raised hover:bg-background-subtle px-2.5 py-1 text-[11px] text-muted hover:text-foreground transition cursor-pointer truncate max-w-full"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-700 space-y-2">
                <div className="font-semibold">{aiError}</div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {aiError.includes("API") && (
                    <button
                      type="button"
                      onClick={() => {
                        resetAndClose();
                        onOpenApiKeyModal();
                      }}
                      className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 text-xs"
                    >
                      <span>🔑</span>
                      <span>API Anahtarını Gir</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsManualAiModalOpen(true)}
                    className="secondary-button border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs text-amber-800"
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
                  className="primary-button flex-1 py-2.5 text-xs"
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 transition cursor-pointer shrink-0"
                  title="Yapay zeka çalışmazsa: Harici yapay zeka (ChatGPT / Claude / Gemini Web) promptu al ve sonucu yapıştır"
                  aria-label="Harici Yapay Zeka Kurtarma Modu"
                >
                  <span className="text-base">🚨</span>
                </button>
              </div>
            )}

            {/* Analysis Result Preview Card */}
            {analysisResult && (
              <div className="ds-card-lavender p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-border-lavender pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <span>✓</span> Analiz Tamamlandı: {currentTotalCalories} kcal
                    {modelUsedInfo?.name && (
                      <span className="ds-badge ds-badge-primary text-[9px] px-1.5 py-0">
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
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
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
                      className="rounded-xl border border-border bg-surface p-2.5 space-y-1.5 text-xs"
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
                          className="text-muted hover:text-rose-600 text-xs px-1 cursor-pointer"
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
                            className="w-full rounded-lg bg-surface-raised border border-border px-1.5 py-0.5 text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-muted block text-[10px]">Kalori (kcal)</label>
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => handleItemFieldChange(idx, "calories", e.target.value)}
                            className="w-full rounded-lg bg-surface-raised border border-border px-1.5 py-0.5 text-foreground font-bold tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="text-muted block text-[10px]">Protein (g)</label>
                          <input
                            type="number"
                            value={item.protein}
                            onChange={(e) => handleItemFieldChange(idx, "protein", e.target.value)}
                            className="w-full rounded-lg bg-surface-raised border border-border px-1.5 py-0.5 text-foreground tabular-nums"
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
                              className="w-1/2 rounded-lg bg-surface-raised border border-border px-1 py-0.5 text-foreground tabular-nums"
                            />
                            <input
                              type="number"
                              title="Yağ"
                              value={item.fat}
                              onChange={(e) => handleItemFieldChange(idx, "fat", e.target.value)}
                              className="w-1/2 rounded-lg bg-surface-raised border border-border px-1 py-0.5 text-foreground tabular-nums"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {analysisResult.note && (
                  <p className="text-[11px] text-foreground-secondary italic">
                    💡 {analysisResult.note}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisResult(null)}
                    className="ghost-button px-2.5 py-1.5 text-xs"
                  >
                    ← Yeniden Yaz
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAiItems}
                    className="primary-button px-5 py-2 text-xs"
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
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-raised border border-border">
              <span className="text-xs font-bold text-foreground">Hangi Öğüne Eklensin?</span>
              <div className="flex flex-wrap gap-1">
                {MEAL_OPTIONS.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setTargetMealType(m.type)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      targetMealType === m.type
                        ? "bg-primary text-white shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Tab Selector */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-surface-raised border border-border text-xs">
              <button
                type="button"
                onClick={() => setSavedSubTab("history")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  savedSubTab === "history"
                    ? "bg-surface text-primary shadow-2xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>📚</span>
                <span>Besin Geçmişi / DB</span>
                <span className="ds-badge ds-badge-primary text-[10px] px-1.5 py-0">
                  {foodHistory.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSavedSubTab("favorites")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  savedSubTab === "favorites"
                    ? "bg-surface text-primary shadow-2xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>⭐</span>
                <span>Favoriler</span>
                <span className="ds-badge ds-badge-warning text-[10px] px-1.5 py-0">
                  {savedFoods.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSavedSubTab("templates")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  savedSubTab === "templates"
                    ? "bg-surface text-primary shadow-2xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>📋</span>
                <span>Şablonlar</span>
                <span className="ds-badge ds-badge-neutral text-[10px] px-1.5 py-0">
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
                    className="field pl-9 pr-8 text-xs h-9"
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
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted space-y-1">
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
                          className="rounded-xl border border-border bg-surface-raised p-3 flex items-center justify-between transition text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground truncate">{item.name}</span>
                              {item.useCount > 1 && (
                                <span className="ds-badge ds-badge-warning text-[9px] px-1.5 py-0 shrink-0">
                                  🔥 {item.useCount}x
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted mt-0.5 tabular-nums">
                              {item.portion} • <b className="text-foreground">{item.calories} kcal</b> • P:{item.protein}g K:{item.carbs}g Y:{item.fat}g
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Star to Favorite */}
                            <button
                              type="button"
                              onClick={() => handleToggleFavoriteFromHistory(item)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition cursor-pointer ${
                                isStarred
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-600"
                                  : "bg-surface border-border text-muted hover:text-amber-600 hover:border-amber-500/30"
                              }`}
                              title={isStarred ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                            >
                              {isStarred ? "★" : "☆"}
                            </button>

                            {/* Add to Meal */}
                            <button
                              type="button"
                              onClick={() => handleAddFromHistory(item)}
                              className="accent-button px-3 py-1.5 text-xs h-8 min-h-0"
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
                              className="text-muted hover:text-rose-600 text-xs px-1 cursor-pointer"
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
                    className="ds-card-lavender p-3 space-y-2 text-xs"
                  >
                    <div className="font-bold text-foreground text-xs">Yeni Sık Kullanılan Besin</div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Besin Adı (örn: Haşlanmış Yumurta)"
                        value={newFoodName}
                        onChange={(e) => setNewFoodName(e.target.value)}
                        className="col-span-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-foreground"
                      />
                      <input
                        type="text"
                        placeholder="Porsiyon (örn: 1 adet)"
                        value={newFoodPortion}
                        onChange={(e) => setNewFoodPortion(e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        required
                        placeholder="Kalori *"
                        value={newFoodCalories}
                        onChange={(e) => setNewFoodCalories(e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-foreground font-bold tabular-nums"
                      />
                      <input
                        type="number"
                        placeholder="Protein (g)"
                        value={newFoodProtein}
                        onChange={(e) => setNewFoodProtein(e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-foreground tabular-nums"
                      />
                      <input
                        type="number"
                        placeholder="Karb (g)"
                        value={newFoodCarbs}
                        onChange={(e) => setNewFoodCarbs(e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-foreground tabular-nums"
                      />
                      <input
                        type="number"
                        placeholder="Yağ (g)"
                        value={newFoodFat}
                        onChange={(e) => setNewFoodFat(e.target.value)}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-foreground tabular-nums"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewFood(false)}
                        className="secondary-button px-3 py-1 text-xs h-7 min-h-0"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="primary-button px-3 py-1 text-xs h-7 min-h-0"
                      >
                        Kaydet
                      </button>
                    </div>
                  </form>
                )}

                {savedFoods.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                    Henüz favori tekil besin eklemediniz.
                    <p className="text-[10px] text-muted mt-0.5">
                      Yemeklerin yanındaki ⭐ butonuna veya Besin Geçmişi listesindeki yıldızlara basarak sık tükettiğiniz yiyecekleri buraya kaydedebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {savedFoods.map((food) => (
                      <div
                        key={food.id}
                        className="rounded-xl border border-border bg-surface-raised p-2.5 flex items-center justify-between transition text-xs"
                      >
                        <div className="min-w-0 pr-1.5">
                          <span className="font-bold text-foreground block truncate">
                            {food.name}
                          </span>
                          <span className="text-[10px] text-muted block tabular-nums">
                            {food.portion} • <b className="text-foreground">{food.calories} kcal</b>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddSingleSavedFood(food)}
                            className="accent-button px-2.5 py-1 text-[11px] h-7 min-h-0"
                          >
                            + Ekle
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteSavedFood(food.id);
                              refreshSavedLists();
                            }}
                            className="text-muted hover:text-rose-600 text-xs px-1 cursor-pointer"
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
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                    Henüz kaydedilmiş öğün şablonunuz yok.
                    <p className="text-[10px] text-muted mt-1">
                      Günün öğünleri kartlarındaki &quot;💾 Öğünü Kaydet&quot; butonuna basarak sık yediğiniz menüleri kaydedebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {savedTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="rounded-xl border border-border bg-surface-raised p-3 flex items-center justify-between transition"
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
                          <div className="text-[11px] text-muted mt-0.5 tabular-nums">
                            <b className="text-foreground">{tpl.totalCalories} kcal</b> • P:{tpl.totalProtein}g K:{tpl.totalCarbs}g Y:{tpl.totalFat}g
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddTemplate(tpl)}
                            className="accent-button px-3 py-1.5 text-xs h-8 min-h-0"
                          >
                            + Ekle
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteMealTemplate(tpl.id);
                              refreshSavedLists();
                            }}
                            className="text-muted hover:text-rose-600 text-xs px-1 cursor-pointer"
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
                        ? "border-primary bg-accent/60 text-primary"
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
                className="field text-xs"
              />

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && matchingSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-border-lavender bg-surface shadow-lg overflow-hidden divide-y divide-border max-h-48 overflow-y-auto">
                  {matchingSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-surface-raised transition text-left cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-foreground block truncate">{sug.name}</span>
                        <span className="text-[10px] text-muted block truncate tabular-nums">
                          {sug.portion} • {sug.calories} kcal • P:{sug.protein}g K:{sug.carbs}g Y:{sug.fat}g
                        </span>
                      </div>
                      <span className="ds-badge ds-badge-primary text-[10px] shrink-0">
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
                  className="field text-xs"
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
                  className="field text-xs font-bold tabular-nums"
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
                  className="field text-xs tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted">Karb (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(e.target.value)}
                  className="field text-xs tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted">Yağ (g)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={manualFat}
                  onChange={(e) => setManualFat(e.target.value)}
                  className="field text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={resetAndClose}
                className="secondary-button px-4 py-2 text-xs"
              >
                İptal
              </button>
              <button
                type="submit"
                className="primary-button px-5 py-2 text-xs"
              >
                Kaydet
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 4: SHARED MEALS (PAYLAŞILMIŞ) ================= */}
        {activeTab === "shared" && (
          <div className="space-y-4">
            {/* Target Meal Type Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-raised border border-border">
              <span className="text-xs font-bold text-foreground">Hangi Öğüne Eklensin?</span>
              <div className="flex flex-wrap gap-1">
                {MEAL_OPTIONS.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setSharedTargetMealType(m.type)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      sharedTargetMealType === m.type
                        ? "bg-primary text-white shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 1: Explicitly Shared Meals */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>🤝</span>
                  <span>Paylaşılan Öğünler</span>
                </span>
                <span className="text-[10px] text-muted">
                  Öğün kartlarındaki &quot;🤝 Paylaş&quot; butonuyla eklenir
                </span>
              </div>

              {sharedMeals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted space-y-1">
                  <p className="font-semibold text-foreground">
                    Henüz paylaşılmış bir öğün yok.
                  </p>
                  <p className="text-[11px] text-muted">
                    Günün öğünleri kartlarında yer alan <b>&quot;🤝 Paylaş&quot;</b> butonuna basarak yediğiniz menüyü diğer kullanıcılarla paylaşabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {sharedMeals.map((sm) => {
                    const mOpt = MEAL_OPTIONS.find((m) => m.type === sm.mealType);
                    return (
                      <div
                        key={sm.id}
                        className="rounded-xl border border-border bg-surface-raised p-3 space-y-2 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="ds-badge ds-badge-primary text-[10px] px-2 py-0.5">
                                👤 {sm.sharedByName}
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {mOpt ? `${mOpt.icon} ${mOpt.label}` : sm.title}
                              </span>
                              <span className="text-[10px] text-muted">
                                ({sm.date})
                              </span>
                            </div>
                            <div className="text-[11px] text-muted mt-1 tabular-nums">
                              <b className="text-foreground">{sm.totalCalories} kcal</b> • P:{Math.round(sm.totalProtein)}g K:{Math.round(sm.totalCarbs)}g Y:{Math.round(sm.totalFat)}g
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const itemsToAdd: Omit<FoodItem, "id" | "createdAt">[] = sm.items.map(
                                  (i) => ({
                                    name: i.name,
                                    portion: i.portion,
                                    calories: i.calories,
                                    protein: i.protein,
                                    carbs: i.carbs,
                                    fat: i.fat,
                                    mealType: sharedTargetMealType,
                                    source: "manual",
                                  })
                                );
                                onAddItems(itemsToAdd);
                                resetAndClose();
                              }}
                              className="primary-button px-3 py-1.5 text-xs h-8 min-h-0"
                            >
                              + Menüyü Ekle
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                deleteSharedMeal(sm.id);
                                refreshSavedLists();
                              }}
                              className="text-muted hover:text-rose-600 text-xs px-1.5 cursor-pointer"
                              title="Paylaşımı Kaldır"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-foreground-secondary bg-surface rounded-lg px-2.5 py-1.5 border border-border">
                          {sm.items.map((i) => `${i.name} (${i.portion})`).join(", ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Other Household Members' Meals from Selected Date */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>🏠</span>
                  <span>Diğer Hane Üyelerinin Bugünkü Öğünleri</span>
                </span>
                <span className="text-[10px] text-muted">Otomatik senkronize</span>
              </div>

              {otherProfilesDailyMeals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-3.5 text-center text-xs text-muted">
                  Seçili günde diğer kullanıcıların girdiği bir öğün bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {otherProfilesDailyMeals.map((om) => (
                    <div
                      key={om.id}
                      className="rounded-xl border border-border bg-surface-raised p-3 space-y-1.5 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="ds-badge ds-badge-neutral text-[10px] px-2 py-0.5">
                              👤 {om.profileName}
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {om.mealIcon} {om.mealLabel}
                            </span>
                            <span className="text-[10px] text-muted">
                              ({om.items.length} yiyecek)
                            </span>
                          </div>
                          <div className="text-[11px] text-muted mt-0.5 tabular-nums">
                            <b className="text-foreground">{om.totalCalories} kcal</b> • P:{Math.round(om.totalProtein)}g K:{Math.round(om.totalCarbs)}g Y:{Math.round(om.totalFat)}g
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const itemsToAdd: Omit<FoodItem, "id" | "createdAt">[] = om.items.map(
                              (i) => ({
                                name: i.name,
                                portion: i.portion,
                                calories: i.calories,
                                protein: i.protein,
                                carbs: i.carbs,
                                fat: i.fat,
                                mealType: sharedTargetMealType,
                                source: "manual",
                              })
                            );
                            onAddItems(itemsToAdd);
                            resetAndClose();
                          }}
                          className="accent-button px-3 py-1.5 text-xs h-8 min-h-0 shrink-0"
                        >
                          + Aynı Menüyü Ekle
                        </button>
                      </div>

                      <div className="text-[11px] text-muted truncate">
                        {om.items.map((i) => i.name).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: EXTERNAL AI / ALARM FALLBACK ================= */}
      {isManualAiModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-lg space-y-4 my-8 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-lg">
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
                className="icon-button h-8 w-8"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Step 1: Copy Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-primary text-[10px] font-bold">
                    1
                  </span>
                  <span>Bu Promptu Kopyalayın:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyExternalPrompt}
                  className="primary-button px-3 py-1.5 text-xs h-8 min-h-0"
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
                  className="w-full font-mono text-[11px] rounded-xl border border-border bg-surface-raised p-3 text-muted select-all focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Quick AI Links */}
              <div className="flex items-center gap-2 text-[11px] text-muted pt-0.5">
                <span className="font-semibold text-foreground">Kestirme:</span>
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2 py-0.5 bg-surface-raised border border-border text-foreground font-medium hover:text-primary transition inline-flex items-center gap-1"
                >
                  <span>🟢</span> ChatGPT
                </a>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2 py-0.5 bg-surface-raised border border-border text-foreground font-medium hover:text-primary transition inline-flex items-center gap-1"
                >
                  <span>✨</span> Gemini Web
                </a>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2 py-0.5 bg-surface-raised border border-border text-foreground font-medium hover:text-primary transition inline-flex items-center gap-1"
                >
                  <span>🟠</span> Claude
                </a>
              </div>
            </div>

            {/* Step 2: Paste Response */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-bold">
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
                className="w-full font-mono text-[11px] rounded-xl border border-border bg-surface-raised p-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition resize-none leading-relaxed"
              />

              {manualAiParseError && (
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-2.5 text-xs text-rose-700">
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
                  className="secondary-button px-3 py-1.5 text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={!pastedAiResponse.trim()}
                  onClick={handleParseAndImportExternalAi}
                  className="primary-button px-5 py-2 text-xs"
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
