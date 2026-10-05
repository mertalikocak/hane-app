"use client";

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export interface LocalNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

/**
  Checks if the browser / platform supports Web Notifications
 */
export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

/**
 * Returns current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";

  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch (error) {
    console.error("Bildirim izni istenirken hata oluştu:", error);
    return Notification.permission as NotificationPermissionState;
  }
}

/**
 * Displays a local notification using Service Worker (preferred for Android)
 * with a fallback to standard Notification API.
 */
export async function showLocalNotification({
  title,
  body,
  url = "/calendar",
  icon = "/icon-192.png",
  badge = "/icon-192.png",
  tag,
}: LocalNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const options: NotificationOptions = {
    body,
    icon,
    badge,
    tag: tag || `hane-${Date.now()}`,
    data: { url },
    // Android vibration pattern: vibrate 200ms, pause 100ms, vibrate 200ms
    ...(("vibrate" in Notification.prototype || "vibrate" in navigator)
      ? { vibrate: [200, 100, 200] }
      : {}),
  };

  try {
    // Android Chrome & Edge work best through Service Worker registration
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && "showNotification" in registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }

    // Fallback if ServiceWorker isn't active
    new Notification(title, options);
    return true;
  } catch (err) {
    console.warn("Bildirim gösterilemedi:", err);
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Sends a test notification to verify Android status bar integration
 */
export async function triggerTestNotification(): Promise<{ success: boolean; message: string }> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      message: "Tarayıcınız bildirim desteği sunmuyor.",
    };
  }

  let permission = getNotificationPermission();
  if (permission === "default") {
    permission = await requestNotificationPermission();
  }

  if (permission !== "granted") {
    return {
      success: false,
      message: "Bildirim izni verilmedi. Lütfen tarayıcı ayarlarından siteye bildirim izni verin.",
    };
  }

  const shown = await showLocalNotification({
    title: "🔔 Hane Hatırlatıcı",
    body: "Tebrikler! Android bildirim entegrasyonu başarıyla çalışıyor.",
    url: "/calendar",
    tag: "test-notification",
  });

  if (shown) {
    return {
      success: true,
      message: "Test bildirimi cihazınıza gönderildi!",
    };
  } else {
    return {
      success: false,
      message: "Bildirim gönderilemedi. Lütfen izinleri kontrol edin.",
    };
  }
}
