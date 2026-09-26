import type { MeasurementUnit } from "@/types/common";

export interface LocalIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
}

export interface LocalMeal {
  id: string;
  name: string;
  description: string;
  ingredients: LocalIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalPlanEntry {
  mealId: string;
  dayOfWeek: number;
}

export interface LocalShoppingItem {
  key: string;
  ingredientName: string;
  quantity: number;
  unit: MeasurementUnit;
  isCompleted: boolean;
}

export const STORAGE_KEYS = {
  meals: "hane-dinner:meals",
  plans: "hane-dinner:plans",
  shopping: "hane-dinner:shopping",
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("hane-dinner:storage"));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now();
}
