"use client";

import React, { useState, useEffect } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerTestNotification,
  type NotificationPermissionState,
} from "@/lib/notifications/notificationService";

export function NotificationBellButton() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  if (!supported) return null;

  const handleRequestPermission = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === "granted") {
        setStatusMessage({ type: "success", text: "Bildirim izni verildi! Artık etkinliklerinizi kaçırmayacaksınız." });
      } else if (res === "denied") {
        setStatusMessage({ type: "error", text: "Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsiniz." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await triggerTestNotification();
      setPermission(getNotificationPermission());
      setStatusMessage({
        type: res.success ? "success" : "error",
        text: res.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isGranted = permission === "granted";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
          isGranted
            ? "bg-primary/10 border-primary/25 text-primary hover:bg-primary/20"
            : "bg-surface-raised border-border text-foreground hover:bg-border/40"
        }`}
        title="Bildirim Ayarları"
      >
        <span className="text-sm">🔔</span>
        <span className="hidden sm:inline">
          {isGranted ? "Bildirimler Açık" : "Bildirimleri Aç"}
        </span>
        {!isGranted && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] z-50 rounded-2xl bg-surface border border-border shadow-xl p-4 text-foreground animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <h4 className="font-bold text-sm">Android & Web Bildirimleri</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-3 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-raised border border-border/60">
                <span className="font-medium text-foreground">İzin Durumu:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    isGranted
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : permission === "denied"
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isGranted
                    ? "✓ İzin Verildi"
                    : permission === "denied"
                    ? "✕ Engellendi"
                    : "Beklemede"}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-muted">
                Bildirimler açıkken takviminizdeki etkinliklere <strong>15 dakika kala</strong> ve <strong>etkinlik saatinde</strong> telefonunuzun bildirim çubuğunda hatırlatıcı gösterilir.
              </p>

              {statusMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-medium border ${
                    statusMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {!isGranted ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRequestPermission}
                  className="w-full py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {loading ? "İzin İsteniyor..." : "🔔 Bildirim İzni Ver"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleTestNotification}
                  className="w-full py-2.5 px-3 rounded-xl bg-primary/10 border border-primary/25 text-primary font-bold text-xs hover:bg-primary/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Gönderiliyor..." : "📲 Test Bildirimi Gönder"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
