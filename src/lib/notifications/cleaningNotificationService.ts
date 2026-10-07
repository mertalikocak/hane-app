"use client";

import { getRoomStatuses } from "@/storage/cleaningStorage";
import {
  showLocalNotification,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
} from "./notificationService";

export interface CleaningReminderConfig {
  enabled: boolean;
  time: string; // Default: "12:00"
}

export const STORAGE_KEY_CLEANING_REMINDER = "hane_cleaning_reminder_config";
export const STORAGE_KEY_CLEANING_NOTIFIED_DATE = "hane_cleaning_last_notified_date";
export const CLEANING_REMINDER_EVENT = "hane_cleaning_reminder_updated";

export function getCleaningReminderConfig(): CleaningReminderConfig {
  if (typeof window === "undefined") {
    return { enabled: true, time: "12:00" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLEANING_REMINDER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { enabled: true, time: "12:00" };
}

export function saveCleaningReminderConfig(config: CleaningReminderConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CLEANING_REMINDER, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(CLEANING_REMINDER_EVENT));
}

/**
 * Returns rooms that are currently due or overdue for cleaning.
 */
export function getDueRoomsForCleaning() {
  const statuses = getRoomStatuses();
  return statuses.filter((s) => s.statusLevel === "due" || s.statusLevel === "overdue");
}

/**
 * Sends a notification listing the rooms waiting for cleaning.
 */
export async function sendCleaningReminderNotification(force = false): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isNotificationSupported()) {
    return { success: false, message: "Tarayıcınız bildirimleri desteklemiyor." };
  }

  const permission = getNotificationPermission();
  if (permission !== "granted") {
    return {
      success: false,
      message: "Bildirim izni verilmemiş. Lütfen önce bildirim iznini açın.",
    };
  }

  const dueRooms = getDueRoomsForCleaning();

  if (dueRooms.length === 0 && !force) {
    return { success: false, message: "Şu anda temizlik bekleyen oda bulunmuyor." };
  }

  let title = "🧹 Temizlik Vakti Geldi!";
  let body = "";

  if (dueRooms.length > 0) {
    const roomNames = dueRooms.map((r) => `${r.room.name}`).join(", ");
    if (dueRooms.length === 1) {
      body = `${roomNames} temizlik bekliyor!`;
    } else {
      body = `Şu odalar temizlik bekliyor: ${roomNames}`;
    }
  } else {
    // For test / forced triggers when all rooms are clean
    title = "🧹 Hane Cleaning Kontrolü";
    body = "Tüm odalarınız tertemiz görünüyor! Temizlik durumlarını incelemek için dokunun.";
  }

  const todayDateStr = new Date().toISOString().split("T")[0];

  const sent = await showLocalNotification({
    title,
    body,
    url: "/cleaning",
    tag: `cleaning-reminder-${todayDateStr}`,
  });

  if (sent) {
    return { success: true, message: "Temizlik bildirimi gönderildi." };
  } else {
    return { success: false, message: "Bildirim gönderilemedi." };
  }
}

/**
 * Checks if it is 12:00 (or configured time) and sends the reminder if not yet sent today.
 */
export async function checkAndSendCleaningReminder(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getNotificationPermission() !== "granted") return;

  const config = getCleaningReminderConfig();
  if (!config.enabled || !config.time) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayDateStr = `${year}-${month}-${day}`;

  const lastNotifiedDate = localStorage.getItem(STORAGE_KEY_CLEANING_NOTIFIED_DATE);
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

  // If time is within [targetTime, targetTime + 45 minutes]
  if (currentTotal >= targetTotal && currentTotal <= targetTotal + 45) {
    const dueRooms = getDueRoomsForCleaning();
    if (dueRooms.length > 0) {
      localStorage.setItem(STORAGE_KEY_CLEANING_NOTIFIED_DATE, todayDateStr);
      await sendCleaningReminderNotification(false);
    }
  }
}
