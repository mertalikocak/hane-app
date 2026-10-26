export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number; // gram
  carbs: number; // gram
  fat: number; // gram
  mealType: MealType;
  source: "ai" | "manual" | "dinner";
  dinnerMealId?: string;
  createdAt: string;
}

export interface DailyCalorieRecord {
  id: string;
  date: string; // YYYY-MM-DD
  profileId: string;
  targetCalories: number;
  items: FoodItem[];
  updatedAt: string;
}

export interface MacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ProfileCalorieMeta {
  profileId: string;
  name: string;
  gender?: "male" | "female";
  height?: number; // cm
  weight?: number; // kg
  bmr: number; // Bazal Metabolizma Hızı (kcal)
  suggestedCalories: number; // Bakım/Hedef kalori (kcal)
}

export interface AIFoodAnalysisResult {
  suggestedMealType: MealType;
  items: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  note?: string;
}

export interface SavedMealTemplate {
  id: string;
  title: string;
  mealType: MealType;
  items: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
}

export interface SavedFoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface HistoryFoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  useCount: number;
  lastUsedAt: string;
  createdAt: string;
}
