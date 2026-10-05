"use client";

import { useEffect } from "react";
import { useCalendarNotificationScheduler } from "@/lib/notifications/useCalendarNotificationScheduler";

export function ServiceWorkerRegister() {
  useCalendarNotificationScheduler();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Hane App Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}

