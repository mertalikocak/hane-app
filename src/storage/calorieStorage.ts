import {
  DailyCalorieRecord,
  FoodItem,
  MacroSummary,
  MealType,
  ProfileCalorieMeta,
  SavedMealTemplate,
  SavedFoodItem,
  HistoryFoodItem,
  SharedMeal,
} from "@/domain/calorieTypes";
import { Profile } from "@/domain/bodyTrackingTypes";
import {
  STORAGE_KEYS as DINNER_STORAGE_KEYS,
  type LocalMeal,
  type LocalPlanEntry,
  readStorage as readDinnerStorage,
} from "@/lib/local-storage/store";
import { getValidWeekStart } from "@/lib/date/week";
import type { DayOfWeek } from "@/types/common";

export const CALORIE_STORAGE_KEYS = {
  records: "hane_calorie_daily_records",
  customTargets: "hane_calorie_custom_targets",
  geminiApiKey: "hane_gemini_api_key",
  savedTemplates: "hane_calorie_saved_templates",
  savedFoods: "hane_calorie_saved_foods",
  foodHistory: "hane_calorie_food_history",
  sharedMeals: "hane_calorie_shared_meals",
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("hane_calorie_updated"));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export function getAllCalorieRecords(): DailyCalorieRecord[] {
  return safeGet<DailyCalorieRecord[]>(CALORIE_STORAGE_KEYS.records, []);
}

export function getCustomTargets(): Record<string, number> {
  return safeGet<Record<string, number>>(CALORIE_STORAGE_KEYS.customTargets, {});
}

export function setCustomTarget(profileId: string, targetCalories: number): void {
  const current = getCustomTargets();
  current[profileId] = targetCalories;
  safeSet(CALORIE_STORAGE_KEYS.customTargets, current);

  // Mevcut profildeki tüm kayıtların hedefini de güncelle
  const all = getAllCalorieRecords();
  let changed = false;
  for (const record of all) {
    if (record.profileId === profileId && record.targetCalories !== targetCalories) {
      record.targetCalories = targetCalories;
      record.updatedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) {
    safeSet(CALORIE_STORAGE_KEYS.records, all);
  }
}

/**
 * Calculates BMR and suggested daily maintenance calories based on Hane Fit profile data.
 * Mifflin-St Jeor equation:
 * Men: (10 * weight kg) + (6.25 * height cm) - (5 * age) + 5
 * Women: (10 * weight kg) + (6.25 * height cm) - (5 * age) - 161
 */
export function calculateProfileCalories(
  profile: Profile | null,
  latestWeight?: number
): ProfileCalorieMeta {
  const defaultWeight = 70;
  const defaultHeight = 175;
  const estimatedAge = 30; // Varsayılan yetişkin yaş ortalaması

  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "Bireysel";
  const gender = profile?.gender || "male";
  const height = profile?.height || defaultHeight;
  const weight = latestWeight && latestWeight > 0 ? latestWeight : defaultWeight;

  let bmr: number;
  if (gender === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * estimatedAge - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * estimatedAge + 5;
  }

  // Hafif-orta aktif yaşam tarzı çarpanı (1.35x)
  const suggested = Math.round((bmr * 1.35) / 50) * 50;

  return {
    profileId: profile?.id || "default",
    name,
    gender,
    height,
    weight,
    bmr: Math.round(bmr),
    suggestedCalories: suggested > 1200 ? suggested : 2000,
  };
}

export function getDailyRecord(
  date: string,
  profileId: string,
  fallbackTarget: number = 2000
): DailyCalorieRecord {
  const all = getAllCalorieRecords();
  const customTargets = getCustomTargets();
  const target = customTargets[profileId] || fallbackTarget;
  const existing = all.find((r) => r.date === date && r.profileId === profileId);

  if (existing) {
    // Özel hedef tanımlanmışsa veya değişmişse kaydı güncel tut
    if (customTargets[profileId] && existing.targetCalories !== customTargets[profileId]) {
      existing.targetCalories = customTargets[profileId];
      saveDailyRecord(existing);
    }
    return existing;
  }

  return {
    id: `cal_${date}_${profileId}`,
    date,
    profileId,
    targetCalories: target,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

export function saveDailyRecord(record: DailyCalorieRecord): void {
  const all = getAllCalorieRecords();
  const index = all.findIndex(
    (r) => r.date === record.date && r.profileId === record.profileId
  );

  const updatedRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    all[index] = updatedRecord;
  } else {
    all.push(updatedRecord);
  }

  safeSet(CALORIE_STORAGE_KEYS.records, all);
}

export function addFoodItemToDate(
  date: string,
  profileId: string,
  itemInput: Omit<FoodItem, "id" | "createdAt">,
  fallbackTarget: number = 2000
): DailyCalorieRecord {
  const record = getDailyRecord(date, profileId, fallbackTarget);
  const newItem: FoodItem = {
    ...itemInput,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  record.items.push(newItem);
  saveDailyRecord(record);

  // Otomatik besin geçmişi veritabanına ekle / kullanım sayısını artır
  recordFoodToHistory(itemInput);

  return record;
}

export function removeFoodItemFromDate(
  date: string,
  profileId: string,
  itemId: string
): DailyCalorieRecord {
  const record = getDailyRecord(date, profileId);
  record.items = record.items.filter((item) => item.id !== itemId);
  saveDailyRecord(record);
  return record;
}

export function updateFoodItemInDate(
  date: string,
  profileId: string,
  updatedItem: FoodItem
): DailyCalorieRecord {
  const record = getDailyRecord(date, profileId);
  const index = record.items.findIndex((i) => i.id === updatedItem.id);
  if (index >= 0) {
    record.items[index] = updatedItem;
    saveDailyRecord(record);
  }
  return record;
}

export function calculateMacroSummary(items: FoodItem[]): MacroSummary {
  return items.reduce<MacroSummary>(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein: acc.protein + (Number(item.protein) || 0),
      carbs: acc.carbs + (Number(item.carbs) || 0),
      fat: acc.fat + (Number(item.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Client-side Gemini API key getter/setter
export function getStoredGeminiApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CALORIE_STORAGE_KEYS.geminiApiKey) || "";
}

export function setStoredGeminiApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(CALORIE_STORAGE_KEYS.geminiApiKey);
  } else {
    localStorage.setItem(CALORIE_STORAGE_KEYS.geminiApiKey, key.trim());
  }
}

// ================= SAVED TEMPLATES & FOODS =================

export function getSavedTemplates(): SavedMealTemplate[] {
  return safeGet<SavedMealTemplate[]>(CALORIE_STORAGE_KEYS.savedTemplates, []);
}

export function saveMealTemplate(
  title: string,
  mealType: MealType,
  items: FoodItem[]
): SavedMealTemplate {
  const templates = getSavedTemplates();

  // Aynı yemeklerin olduğu bir şablon zaten varsa tekrar ekleme
  const existing = templates.find(
    (t) =>
      t.mealType === mealType &&
      t.items.length === items.length &&
      t.items.every((ti) =>
        items.some((mi) => mi.name.toLowerCase().trim() === ti.name.toLowerCase().trim())
      )
  );
  if (existing) {
    return existing;
  }

  const summary = calculateMacroSummary(items);
  const newTemplate: SavedMealTemplate = {
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    mealType,
    items: items.map((i) => ({
      name: i.name,
      portion: i.portion,
      calories: i.calories,
      protein: i.protein,
      carbs: i.carbs,
      fat: i.fat,
    })),
    totalCalories: summary.calories,
    totalProtein: summary.protein,
    totalCarbs: summary.carbs,
    totalFat: summary.fat,
    createdAt: new Date().toISOString(),
  };

  templates.unshift(newTemplate);
  safeSet(CALORIE_STORAGE_KEYS.savedTemplates, templates);
  return newTemplate;
}

export function deleteMealTemplate(id: string): void {
  const templates = getSavedTemplates().filter((t) => t.id !== id);
  safeSet(CALORIE_STORAGE_KEYS.savedTemplates, templates);
}

// ================= SHARED MEALS (PAYLAŞILAN ÖĞÜNLER) =================

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle Yemeği",
  dinner: "Akşam Yemeği",
  snack: "Ara Öğün",
};

export function getSharedMeals(): SharedMeal[] {
  return safeGet<SharedMeal[]>(CALORIE_STORAGE_KEYS.sharedMeals, []);
}

export function shareMeal(params: {
  mealType: MealType;
  date: string;
  sharedByProfileId: string;
  sharedByName: string;
  items: FoodItem[];
  customTitle?: string;
}): SharedMeal {
  const sharedList = getSharedMeals();

  // Aynı tarihte, aynı öğünde ve aynı yemek listesiyle zaten paylaşılmışsa güncelle/döndür
  const existing = sharedList.find(
    (s) =>
      s.date === params.date &&
      s.mealType === params.mealType &&
      s.sharedByProfileId === params.sharedByProfileId &&
      s.items.length === params.items.length &&
      s.items.every((si) =>
        params.items.some(
          (mi) => mi.name.toLowerCase().trim() === si.name.toLowerCase().trim()
        )
      )
  );
  if (existing) {
    return existing;
  }

  const summary = calculateMacroSummary(params.items);
  const defaultTitle = `${params.sharedByName} • ${MEAL_TYPE_LABELS[params.mealType]}`;

  const newShared: SharedMeal = {
    id: `shr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: params.customTitle?.trim() || defaultTitle,
    mealType: params.mealType,
    date: params.date,
    sharedByProfileId: params.sharedByProfileId,
    sharedByName: params.sharedByName,
    items: params.items.map((i) => ({
      name: i.name,
      portion: i.portion,
      calories: Number(i.calories) || 0,
      protein: Number(i.protein) || 0,
      carbs: Number(i.carbs) || 0,
      fat: Number(i.fat) || 0,
    })),
    totalCalories: summary.calories,
    totalProtein: summary.protein,
    totalCarbs: summary.carbs,
    totalFat: summary.fat,
    createdAt: new Date().toISOString(),
  };

  sharedList.unshift(newShared);
  // En son 30 paylaşılan öğünü tut
  safeSet(CALORIE_STORAGE_KEYS.sharedMeals, sharedList.slice(0, 30));
  return newShared;
}

export function deleteSharedMeal(id: string): void {
  const filtered = getSharedMeals().filter((s) => s.id !== id);
  safeSet(CALORIE_STORAGE_KEYS.sharedMeals, filtered);
}

export function getSavedFoods(): SavedFoodItem[] {
  return safeGet<SavedFoodItem[]>(CALORIE_STORAGE_KEYS.savedFoods, []);
}

export function saveFoodItem(
  food: Omit<SavedFoodItem, "id" | "createdAt">
): SavedFoodItem {
  const foods = getSavedFoods();
  const existing = foods.find(
    (f) => f.name.toLowerCase().trim() === food.name.toLowerCase().trim()
  );
  if (existing) {
    return existing;
  }

  const newFood: SavedFoodItem = {
    ...food,
    id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  foods.unshift(newFood);
  safeSet(CALORIE_STORAGE_KEYS.savedFoods, foods);
  return newFood;
}

export function toggleSavedFood(
  food: Omit<SavedFoodItem, "id" | "createdAt">
): { isSaved: boolean; food: SavedFoodItem } {
  const foods = getSavedFoods();
  const existingIndex = foods.findIndex(
    (f) => f.name.toLowerCase().trim() === food.name.toLowerCase().trim()
  );

  if (existingIndex >= 0) {
    const removed = foods[existingIndex];
    foods.splice(existingIndex, 1);
    safeSet(CALORIE_STORAGE_KEYS.savedFoods, foods);
    return { isSaved: false, food: removed };
  } else {
    const newFood: SavedFoodItem = {
      ...food,
      id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    foods.unshift(newFood);
    safeSet(CALORIE_STORAGE_KEYS.savedFoods, foods);
    return { isSaved: true, food: newFood };
  }
}

export function deleteSavedFood(id: string): void {
  const foods = getSavedFoods().filter((f) => f.id !== id);
  safeSet(CALORIE_STORAGE_KEYS.savedFoods, foods);
}

// ================= BESİN GEÇMİŞİ / VERİTABANI =================

export function getFoodHistory(): HistoryFoodItem[] {
  return safeGet<HistoryFoodItem[]>(CALORIE_STORAGE_KEYS.foodHistory, []);
}

export function recordFoodToHistory(
  food: {
    name: string;
    portion?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }
): HistoryFoodItem {
  if (!food.name || !food.name.trim()) {
    return {
      id: "unknown",
      name: "",
      portion: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      useCount: 1,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  const history = getFoodHistory();
  const normalized = food.name.trim().toLowerCase();
  const existingIndex = history.findIndex(
    (h) => h.name.trim().toLowerCase() === normalized
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const existing = history[existingIndex];
    const updated: HistoryFoodItem = {
      ...existing,
      name: food.name.trim(),
      portion: food.portion || existing.portion,
      calories: Math.max(0, Math.round(Number(food.calories ?? existing.calories) || 0)),
      protein: Math.max(0, Math.round(Number(food.protein ?? existing.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(food.carbs ?? existing.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(food.fat ?? existing.fat) || 0)),
      useCount: (existing.useCount || 1) + 1,
      lastUsedAt: now,
    };

    history.splice(existingIndex, 1);
    history.unshift(updated);
    safeSet(CALORIE_STORAGE_KEYS.foodHistory, history);
    return updated;
  } else {
    const newItem: HistoryFoodItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: food.name.trim(),
      portion: food.portion || "1 porsiyon",
      calories: Math.max(0, Math.round(Number(food.calories) || 0)),
      protein: Math.max(0, Math.round(Number(food.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(food.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(food.fat) || 0)),
      useCount: 1,
      lastUsedAt: now,
      createdAt: now,
    };
    history.unshift(newItem);
    safeSet(CALORIE_STORAGE_KEYS.foodHistory, history);
    return newItem;
  }
}

export function deleteFromFoodHistory(id: string): void {
  const history = getFoodHistory().filter((h) => h.id !== id);
  safeSet(CALORIE_STORAGE_KEYS.foodHistory, history);
}

export function syncExistingRecordsToHistory(): void {
  const records = getAllCalorieRecords();
  if (records.length === 0) return;

  const history = getFoodHistory();
  const existingMap = new Map(
    history.map((h) => [h.name.trim().toLowerCase(), h])
  );
  let changed = false;

  for (const record of records) {
    for (const item of record.items) {
      if (!item.name || !item.name.trim()) continue;
      const key = item.name.trim().toLowerCase();
      const existing = existingMap.get(key);
      if (existing) {
        existing.useCount = (existing.useCount || 1) + 1;
        changed = true;
      } else {
        const newItem: HistoryFoodItem = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: item.name.trim(),
          portion: item.portion || "1 porsiyon",
          calories: Math.max(0, Math.round(Number(item.calories) || 0)),
          protein: Math.max(0, Math.round(Number(item.protein) || 0)),
          carbs: Math.max(0, Math.round(Number(item.carbs) || 0)),
          fat: Math.max(0, Math.round(Number(item.fat) || 0)),
          useCount: 1,
          lastUsedAt: item.createdAt || record.updatedAt || new Date().toISOString(),
          createdAt: item.createdAt || record.updatedAt || new Date().toISOString(),
        };
        history.push(newItem);
        existingMap.set(key, newItem);
        changed = true;
      }
    }
  }

  if (changed) {
    safeSet(CALORIE_STORAGE_KEYS.foodHistory, history);
  }
}

// ================= HANE DINNER INTEGRATION =================

export function getAllDinnerMeals(): LocalMeal[] {
  return readDinnerStorage<LocalMeal[]>(DINNER_STORAGE_KEYS.meals, []);
}

export function getPlannedDinnerForDate(dateStr: string): LocalMeal | null {
  const meals = getAllDinnerMeals();
  if (meals.length === 0) return null;

  try {
    const weekStart = getValidWeekStart(dateStr);
    const plans = readDinnerStorage<Record<string, LocalPlanEntry[]>>(
      DINNER_STORAGE_KEYS.plans,
      {}
    );
    const weekPlans = plans[weekStart] || [];

    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const jsDay = d.getDay();
    const dayOfWeek = (jsDay === 0 ? 7 : jsDay) as DayOfWeek;

    const assignment = weekPlans.find((p) => p.dayOfWeek === dayOfWeek);
    if (!assignment) return null;

    return meals.find((m) => m.id === assignment.mealId) || null;
  } catch (err) {
    console.error("Error reading planned dinner:", err);
    return null;
  }
}
