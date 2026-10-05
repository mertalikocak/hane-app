"use client";

import { readStorage, STORAGE_KEYS, type LocalMeal, type LocalPlanEntry } from "@/lib/local-storage/store";
import { getCurrentWeekStart } from "@/lib/date/week";
import { showLocalNotification, getNotificationPermission, requestNotificationPermission } from "./notificationService";
import type { DayOfWeek } from "@/types/common";

export interface MealReminderConfig {
  enabled: boolean;
  time: string; // e.g. "19:00"
}

const STORAGE_KEY_MEAL_REMINDER = "hane_meal_reminder_config";
const STORAGE_KEY_MEAL_NOTIFIED_DATE = "hane_meal_last_notified_date";

export function getMealReminderConfig(): MealReminderConfig {
  if (typeof window === "undefined") {
    return { enabled: false, time: "19:00" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEAL_REMINDER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { enabled: false, time: "19:00" };
}

export function saveMealReminderConfig(config: MealReminderConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_MEAL_REMINDER, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("hane_meal_reminder_updated"));
}

/**
 * Gets today's planned meals for the current week
 */
export function getTodayMeals(): LocalMeal[] {
  if (typeof window === "undefined") return [];

  try {
    const weekStart = getCurrentWeekStart();
    const plansByWeek = readStorage<Record<string, LocalPlanEntry[]>>(STORAGE_KEYS.plans, {});
    const meals = readStorage<LocalMeal[]>(STORAGE_KEYS.meals, []);

    const weekPlans = plansByWeek[weekStart] || [];

    const jsDay = new Date().getDay();
    const todayDayOfWeek = (jsDay === 0 ? 7 : jsDay) as DayOfWeek;

    const todayAssignments = weekPlans.filter((p) => p.dayOfWeek === todayDayOfWeek);
    const todayMealList: LocalMeal[] = [];

    for (const assignment of todayAssignments) {
      const found = meals.find((m) => m.id === assignment.mealId);
      if (found) {
        todayMealList.push(found);
      }
    }

    return todayMealList;
  } catch (err) {
    console.error("Bugünkü yemekler alınırken hata:", err);
    return [];
  }
}

/**
 * Sends a notification with today's meal menu
 */
export async function sendMealMenuNotification(): Promise<boolean> {
  const meals = getTodayMeals();

  let body = "";
  if (meals.length > 0) {
    const mealNames = meals.map((m) => m.name).join(", ");
    body = `Bugünün Menüsü: ${mealNames}`;
  } else {
    body = "Bugün için henüz bir akşam yemeği planlanmadı. Menüyü belirlemek için dokunun.";
  }

  return await showLocalNotification({
    title: "🍽️ Akşam Yemeği Vakti!",
    body,
    url: "/dinner",
    tag: `meal-reminder-${new Date().toISOString().split("T")[0]}`,
  });
}

/**
 * Checks if it is time to send the meal reminder and triggers it
 */
export async function checkAndSendMealReminder(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getNotificationPermission() !== "granted") return;

  const config = getMealReminderConfig();
  if (!config.enabled || !config.time) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayDateStr = `${year}-${month}-${day}`;

  const lastNotifiedDate = localStorage.getItem(STORAGE_KEY_MEAL_NOTIFIED_DATE);
  if (lastNotifiedDate === todayDateStr) {
    // Already notified today
    return;
  }

  const [targetHourStr, targetMinStr] = config.time.split(":");
  const targetHour = parseInt(targetHourStr, 10);
  const targetMinute = parseInt(targetMinStr, 10);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const currentTotal = currentHour * 60 + currentMinute;
  const targetTotal = targetHour * 60 + targetMinute;

  // If current time is within [targetTime, targetTime + 15 minutes]
  if (currentTotal >= targetTotal && currentTotal <= targetTotal + 15) {
    localStorage.setItem(STORAGE_KEY_MEAL_NOTIFIED_DATE, todayDateStr);
    await sendMealMenuNotification();
  }
}
