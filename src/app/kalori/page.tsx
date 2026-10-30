"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useProfile } from "@/context/ProfileContext";
import { getMeasurementsByProfile } from "@/storage/bodyStorage";
import {
  calculateMacroSummary,
  calculateProfileCalories,
  getDailyRecord,
  getStoredGeminiApiKey,
  removeFoodItemFromDate,
  addFoodItemToDate,
  getSavedTemplates,
  getSavedFoods,
  toggleSavedFood,
  syncExistingRecordsToHistory,
  getSharedMeals,
  shareMeal,
} from "@/storage/calorieStorage";
import {
  DailyCalorieRecord,
  FoodItem,
  MealType,
  SavedMealTemplate,
  SavedFoodItem,
  SharedMeal,
} from "@/domain/calorieTypes";
import { CalorieHeader } from "@/components/calorie/CalorieHeader";
import { CalorieSummaryCards } from "@/components/calorie/CalorieSummaryCards";
import { MealSection } from "@/components/calorie/MealSection";
import { AddMealModal } from "@/components/calorie/AddMealModal";
import { ApiKeyModal } from "@/components/calorie/ApiKeyModal";
import { EditTargetModal } from "@/components/calorie/EditTargetModal";
import { FetchDinnerModal } from "@/components/calorie/FetchDinnerModal";
import { SaveTemplateModal } from "@/components/calorie/SaveTemplateModal";
import { queueLocalChangePush } from "@/lib/firebase/syncService";

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function KaloriPage() {
  const { activeProfile, activeProfileId, isLoaded } = useProfile();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const [dailyRecord, setDailyRecord] = useState<DailyCalorieRecord | null>(null);

  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialMeal, setAddModalInitialMeal] = useState<MealType>("lunch");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isEditTargetModalOpen, setIsEditTargetModalOpen] = useState(false);
  const [isFetchDinnerOpen, setIsFetchDinnerOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateToSave, setTemplateToSave] = useState<{
    mealType: MealType;
    items: FoodItem[];
  } | null>(null);

  const [hasApiKey, setHasApiKey] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedMealTemplate[]>([]);
  const [savedFoods, setSavedFoods] = useState<SavedFoodItem[]>([]);
  const [sharedMeals, setSharedMeals] = useState<SharedMeal[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check API key presence
  const refreshApiKeyStatus = useCallback(() => {
    const key = getStoredGeminiApiKey();
    setHasApiKey(Boolean(key && key.trim().length > 0));
  }, []);

  // Refresh saved templates, foods and shared meals
  const refreshSavedData = useCallback(() => {
    setSavedTemplates(getSavedTemplates());
    setSavedFoods(getSavedFoods());
    setSharedMeals(getSharedMeals());
  }, []);

  // Compute profile metadata from Hane Fit
  const profileMeta = useMemo(() => {
    if (!activeProfile) {
      return calculateProfileCalories(null);
    }
    const measurements = getMeasurementsByProfile(activeProfile.id);
    const latestWeight = measurements.length > 0 ? measurements[0].weight : undefined;
    return calculateProfileCalories(activeProfile, latestWeight);
  }, [activeProfile]);

  // Load daily record for selectedDate & activeProfileId
  const loadDailyRecord = useCallback(() => {
    const profileId = activeProfileId || "default";
    const record = getDailyRecord(
      selectedDate,
      profileId,
      profileMeta.suggestedCalories
    );
    setDailyRecord(record);
  }, [selectedDate, activeProfileId, profileMeta.suggestedCalories]);

  useEffect(() => {
    syncExistingRecordsToHistory();
    refreshApiKeyStatus();
    refreshSavedData();
  }, [refreshApiKeyStatus, refreshSavedData]);

  useEffect(() => {
    if (isLoaded) {
      loadDailyRecord();
    }
  }, [isLoaded, loadDailyRecord]);

  useEffect(() => {
    const handleStorageChange = () => {
      loadDailyRecord();
      refreshApiKeyStatus();
      refreshSavedData();
    };

    window.addEventListener("hane_calorie_updated", handleStorageChange);
    window.addEventListener("fit_profile_changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("hane_calorie_updated", handleStorageChange);
      window.removeEventListener("fit_profile_changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadDailyRecord, refreshApiKeyStatus, refreshSavedData]);

  // Actions
  const handleAddItems = (newItems: Omit<FoodItem, "id" | "createdAt">[]) => {
    const profileId = activeProfileId || "default";
    newItems.forEach((item) => {
      addFoodItemToDate(
        selectedDate,
        profileId,
        item,
        profileMeta.suggestedCalories
      );
    });
    loadDailyRecord();
    queueLocalChangePush();
  };

  const handleRemoveItem = (itemId: string) => {
    const profileId = activeProfileId || "default";
    removeFoodItemFromDate(selectedDate, profileId, itemId);
    loadDailyRecord();
    queueLocalChangePush();
  };

  const handleOpenAddForMeal = (mealType: MealType) => {
    setAddModalInitialMeal(mealType);
    setIsAddModalOpen(true);
  };

  const handleOpenSaveTemplate = (mealType: MealType, items: FoodItem[]) => {
    setTemplateToSave({ mealType, items });
    setIsSaveTemplateOpen(true);
  };

  const handleShareMeal = (mealType: MealType, items: FoodItem[]) => {
    const profileId = activeProfileId || "default";
    const profileName = activeProfile ? `${activeProfile.firstName}`.trim() : "Hane Sakini";
    shareMeal({
      mealType,
      date: selectedDate,
      sharedByProfileId: profileId,
      sharedByName: profileName,
      items,
    });
    refreshSavedData();
    queueLocalChangePush();
    setToastMessage(`🤝 "${profileName}" olarak bu öğün hane ile paylaşıldı!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleSaveFood = (item: FoodItem) => {
    const res = toggleSavedFood({
      name: item.name,
      portion: item.portion,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    });
    refreshSavedData();
    queueLocalChangePush();
    setToastMessage(
      res.isSaved
        ? `⭐ "${item.name}" favorilere kaydedildi!`
        : `"${item.name}" favorilerden çıkarıldı.`
    );
    setTimeout(() => setToastMessage(null), 2200);
  };

  const macros = useMemo(() => {
    return calculateMacroSummary(dailyRecord?.items || []);
  }, [dailyRecord?.items]);

  const targetCalories = dailyRecord?.targetCalories || profileMeta.suggestedCalories;

  return (
    <div className="space-y-6 pb-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-surface px-4 py-2.5 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Header & Controls */}
      <CalorieHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        profileMeta={profileMeta}
        targetCalories={targetCalories}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenAddModal={() => {
          setAddModalInitialMeal("lunch");
          setIsAddModalOpen(true);
        }}
        onOpenEditTargetModal={() => setIsEditTargetModalOpen(true)}
      />

      {/* Big Summary & Macro Cards */}
      <CalorieSummaryCards
        targetCalories={targetCalories}
        macros={macros}
      />

      {/* 4 Meal Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Günün Öğünleri
          </h2>
          <span className="ds-badge ds-badge-neutral">
            {dailyRecord?.items.length || 0} kayıtlı yiyecek
          </span>
        </div>

        <MealSection
          items={dailyRecord?.items || []}
          savedTemplates={savedTemplates}
          savedFoods={savedFoods}
          sharedMeals={sharedMeals}
          selectedDate={selectedDate}
          activeProfileId={activeProfileId}
          onRemoveItem={handleRemoveItem}
          onOpenAddModalForMeal={handleOpenAddForMeal}
          onOpenFetchDinnerModal={() => setIsFetchDinnerOpen(true)}
          onOpenSaveTemplateModal={handleOpenSaveTemplate}
          onShareMeal={handleShareMeal}
          onToggleSaveFood={handleToggleSaveFood}
        />
      </div>

      {/* Add Meal Modal (AI / Saved / Manual / Shared) */}
      <AddMealModal
        isOpen={isAddModalOpen}
        initialMealType={addModalInitialMeal}
        selectedDate={selectedDate}
        onClose={() => setIsAddModalOpen(false)}
        onAddItems={handleAddItems}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Fetch Dinner Modal (Portion-aware) */}
      <FetchDinnerModal
        isOpen={isFetchDinnerOpen}
        selectedDate={selectedDate}
        onClose={() => setIsFetchDinnerOpen(false)}
        onAddItems={handleAddItems}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Save Meal Template Modal */}
      {templateToSave && (
        <SaveTemplateModal
          isOpen={isSaveTemplateOpen}
          mealType={templateToSave.mealType}
          items={templateToSave.items}
          onClose={() => {
            setIsSaveTemplateOpen(false);
            setTemplateToSave(null);
          }}
          onSaved={() => {
            refreshSavedData();
            window.dispatchEvent(new CustomEvent("hane_calorie_updated"));
          }}
        />
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={() => {
          refreshApiKeyStatus();
          loadDailyRecord();
        }}
      />

      {/* Edit Target Modal */}
      <EditTargetModal
        isOpen={isEditTargetModalOpen}
        profileId={activeProfileId || "default"}
        currentTarget={targetCalories}
        suggestedTarget={profileMeta.suggestedCalories}
        onClose={() => setIsEditTargetModalOpen(false)}
        onTargetUpdated={loadDailyRecord}
      />
    </div>
  );
}
