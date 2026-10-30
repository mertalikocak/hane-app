"use client";

import React, { useState, useEffect } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerTestNotification,
  type NotificationPermissionState,
} from "@/lib/notifications/notificationService";
import { BellIcon, CloseIcon } from "@/components/ui/Icons";

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
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-foreground transition cursor-pointer shadow-2xs group"
          title="Bildirim Ayarları"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-lavender text-primary border border-border-lavender">
              <BellIcon className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                Bildirim Ayarları
              </span>
              <span className="text-[10px] text-muted">
                {isGranted ? "Hatırlatıcılar açık" : "İzin verilmedi"}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isGranted
                ? "bg-success-soft text-success"
                : "bg-warning-soft text-warning"
            }`}
          >
            {isGranted ? "Açık" : "Kapalı"}
          </span>
        </button>
      ) : variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition cursor-pointer ${
            isGranted
              ? "bg-surface-lavender border-border-lavender text-primary hover:bg-accent"
              : "bg-surface border-border text-foreground-secondary hover:bg-surface-raised"
          }`}
          title="Bildirim Ayarları"
        >
          <BellIcon className="h-4 w-4" />
          {!isGranted && (
            <span className="flex h-2 w-2 absolute top-1.5 right-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`relative flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition border cursor-pointer ${
            isGranted
              ? "bg-surface-lavender border-border-lavender text-primary hover:bg-accent"
              : "bg-surface border-border text-foreground-secondary hover:bg-surface-raised"
          }`}
          title="Bildirim Ayarları"
        >
          <BellIcon className="h-3.5 w-3.5" />
          {showLabel && (
            <span className="hidden sm:inline">
              {isGranted ? "Bildirimler Açık" : "Bildirimleri Aç"}
            </span>
          )}
          {!isGranted && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
          )}
        </button>
      )}

      {/* Screen-Centered Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-2xl bg-surface border border-border shadow-lg p-5 text-foreground animate-in zoom-in-95 duration-150 z-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-primary">
                  <BellIcon className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-foreground">Web & Mobil Bildirimler</h4>
                  <p className="text-xs text-muted">Takvim ve yemek hatırlatıcıları</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="icon-button h-8 w-8"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
                <span className="font-semibold text-foreground">Cihaz İzin Durumu:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] ${
                    isGranted
                      ? "bg-success-soft text-success"
                      : permission === "denied"
                      ? "bg-danger-soft text-danger"
                      : "bg-warning-soft text-warning"
                  }`}
                >
                  {isGranted
                    ? "İzin Verildi"
                    : permission === "denied"
                    ? "Engellendi"
                    : "Beklemede"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1.5 text-xs leading-relaxed text-foreground-secondary">
                <div className="font-bold text-foreground">
                  Bildirimler ne zaman gelir?
                </div>
                <p>• Takvim etkinliklerinize <strong>15 dakika kala</strong> ve etkinlik vaktinde.</p>
                <p>• Belirlediğiniz saatte o günün <strong>akşam yemeği menüsü</strong>.</p>
                <p>• Saat <strong>12:00</strong>&apos;de temizlik günü gelen odaların listesi.</p>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    statusMessage.type === "success"
                      ? "bg-success-soft border-success/30 text-success"
                      : "bg-danger-soft border-danger/30 text-danger"
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col gap-2">
              {!isGranted ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRequestPermission}
                  className="primary-button w-full text-xs"
                >
                  {loading ? "İzin İsteniyor..." : "Bildirim İzni Ver"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleTestNotification}
                  className="accent-button w-full text-xs"
                >
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
