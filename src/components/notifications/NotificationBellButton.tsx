"use client";

import React, { useState, useEffect } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerTestNotification,
  type NotificationPermissionState,
} from "@/lib/notifications/notificationService";

interface NotificationBellButtonProps {
  variant?: "default" | "sidebar" | "compact";
  showLabel?: boolean;
}

export function NotificationBellButton({
  variant = "default",
  showLabel = true,
}: NotificationBellButtonProps) {
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
    <>
      {/* Trigger Button Variants */}
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-surface-raised/50 hover:bg-surface border border-border/60 text-foreground transition cursor-pointer shadow-xs group"
          title="Bildirim Ayarları"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
              🔔
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Bildirim Ayarları
              </span>
              <span className="text-[10px] text-muted">
                {isGranted ? "Hatırlatıcılar açık" : "İzin verilmedi"}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isGranted
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isGranted ? "Açık" : "Kapalı"}
          </span>
        </button>
      ) : variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
            isGranted
              ? "bg-primary/10 border-primary/25 text-primary hover:bg-primary/20"
              : "bg-surface-raised border-border text-foreground hover:bg-border/40"
          }`}
          title="Bildirim Ayarları"
        >
          <span className="text-sm">🔔</span>
          {!isGranted && (
            <span className="flex h-2 w-2 absolute top-1.5 right-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
            isGranted
              ? "bg-primary/10 border-primary/25 text-primary hover:bg-primary/20"
              : "bg-surface-raised border-border text-foreground hover:bg-border/40"
          }`}
          title="Bildirim Ayarları"
        >
          <span className="text-sm">🔔</span>
          {showLabel && (
            <span className="hidden sm:inline">
              {isGranted ? "Bildirimler Açık" : "Bildirimleri Aç"}
            </span>
          )}
          {!isGranted && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </button>
      )}

      {/* Screen-Centered Modal Dialog (Never slips off screen on mobile) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered Modal Card */}
          <div className="relative w-full max-w-sm rounded-3xl bg-surface border border-border shadow-2xl p-5 text-foreground animate-in zoom-in-95 duration-150 z-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary text-base">
                  🔔
                </span>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight">Android & Web Bildirimleri</h4>
                  <p className="text-[11px] text-muted">Takvim ve yemek hatırlatıcıları</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-surface-raised border border-border/80 text-muted hover:text-foreground text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="py-4 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-raised border border-border/60">
                <span className="font-medium text-foreground text-xs">Cihaz İzin Durumu:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
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

              <div className="p-3 rounded-2xl bg-surface-raised/60 border border-border/40 space-y-1.5 text-[11px] leading-relaxed text-muted">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <span>ℹ️</span> Bildirimler ne zaman gelir?
                </div>
                <p>• Takvim etkinliklerinize <strong>15 dakika kala</strong> ve etkinlik vaktinde.</p>
                <p>• Belirlediğiniz saatte o günün <strong>akşam yemeği menüsü</strong>.</p>
                <p>• Saat <strong>12:00</strong>'de temizlik günü gelen odaların listesi.</p>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold border animate-in fade-in duration-150 ${
                    statusMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {!isGranted ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRequestPermission}
                  className="w-full py-2.5 px-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {loading ? "İzin İsteniyor..." : "🔔 Bildirim İzni Ver"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleTestNotification}
                  className="w-full py-2.5 px-3 rounded-2xl bg-primary/10 border border-primary/25 text-primary font-bold text-xs hover:bg-primary/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>📲</span>
                  <span>{loading ? "Gönderiliyor..." : "Test Bildirimi Gönder"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
