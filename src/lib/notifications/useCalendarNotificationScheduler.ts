"use client";

import { useEffect, useRef } from "react";
import { getCalendarEvents } from "@/storage/calendarStorage";
import {
  isNotificationSupported,
  getNotificationPermission,
  showLocalNotification,
} from "./notificationService";
import { checkAndSendMealReminder } from "./mealNotificationService";
import { checkAndSendCleaningReminder } from "./cleaningNotificationService";

const STORAGE_KEY_NOTIFIED = "hane_sent_notification_keys";

function getNotifiedKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFIED);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markAsNotified(key: string) {
  if (typeof window === "undefined") return;
  try {
    const set = getNotifiedKeys();
    set.add(key);
    // Keep only last 100 entries to prevent memory bloat
    const list = Array.from(set).slice(-100);
    localStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function useCalendarNotificationScheduler() {
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const checkEventsAndNotify = async () => {
      if (isCheckingRef.current) return;
      if (getNotificationPermission() !== "granted") return;

      isCheckingRef.current = true;
      try {
        const events = getCalendarEvents();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const notifiedKeys = getNotifiedKeys();

        for (const evt of events) {
          if (evt.date !== todayStr) continue;

          // If it's a timed event (e.g. "14:30")
          if (!evt.isAllDay && evt.time) {
            const parts = evt.time.split(":");
            if (parts.length >= 2) {
              const eventHour = parseInt(parts[0], 10);
              const eventMinute = parseInt(parts[1], 10);
              const eventTotalMinutes = eventHour * 60 + eventMinute;
              const diffMinutes = eventTotalMinutes - currentMinutes;

              // 1) 15-minute advance reminder
              const advanceKey = `${evt.id}_advance_${todayStr}`;
              if (diffMinutes > 0 && diffMinutes <= 15 && !notifiedKeys.has(advanceKey)) {
                markAsNotified(advanceKey);
                await showLocalNotification({
                  title: `⏰ 15 Dk Kaldı: ${evt.title}`,
                  body: `${evt.time} vaktindeki etkinliğiniz yaklaşıyor.${evt.description ? ` (${evt.description})` : ""}`,
                  url: "/calendar",
                  tag: advanceKey,
                });
              }

              // 2) Exact time reminder
              const exactKey = `${evt.id}_exact_${todayStr}`;
              if (diffMinutes <= 0 && diffMinutes >= -10 && !notifiedKeys.has(exactKey)) {
                markAsNotified(exactKey);
                await showLocalNotification({
                  title: `🔔 Etkinlik Vakti: ${evt.title}`,
                  body: `${evt.time} — ${evt.title} başladı.${evt.description ? ` ${evt.description}` : ""}`,
                  url: "/calendar",
                  tag: exactKey,
                });
              }
            }
          }
        }

        // Also check daily meal reminder
        await checkAndSendMealReminder();

        // Also check daily cleaning reminder (12:00)
        await checkAndSendCleaningReminder();
      } catch (err) {
        console.error("Bildirim kontrolü hatası:", err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Run check once on load, then every 30 seconds
    checkEventsAndNotify();
    const interval = setInterval(checkEventsAndNotify, 30000);

    return () => clearInterval(interval);
  }, []);
}
