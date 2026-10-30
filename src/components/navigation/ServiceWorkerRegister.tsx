"use client";

import { useEffect } from "react";
import { useCalendarNotificationScheduler } from "@/lib/notifications/useCalendarNotificationScheduler";

export function ServiceWorkerRegister() {
  useCalendarNotificationScheduler();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      // In local development (next dev), unregister any SW so Turbopack/HMR chunks are never served stale from cache
      if (process.env.NODE_ENV === "development" && isLocalhost) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          });
        }
        return;
      }

      const registerSw = () => {
        if ("caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => {
              if (key !== "hane-app-cache-v3") {
                caches.delete(key);
              }
            });
          });
        }

        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            reg.update().catch(() => {});
            console.log("Hane App Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      };

      if (document.readyState === "complete") {
        registerSw();
      } else {
        window.addEventListener("load", registerSw, { once: true });
        return () => window.removeEventListener("load", registerSw);
      }
    }
  }, []);

  return null;
}
