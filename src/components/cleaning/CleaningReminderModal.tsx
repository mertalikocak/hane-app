"use client";

import React, { useState, useEffect } from "react";
import {
  getCleaningReminderConfig,
  saveCleaningReminderConfig,
  sendCleaningReminderNotification,
  type CleaningReminderConfig,
  getDueRoomsForCleaning,
} from "@/lib/notifications/cleaningNotificationService";
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  type NotificationPermissionState,
} from "@/lib/notifications/notificationService";

interface CleaningReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CleaningReminderModal({
  isOpen,
  onClose,
}: CleaningReminderModalProps) {
  const [config, setConfig] = useState<CleaningReminderConfig>({
    enabled: true,
    time: "12:00",
  });
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getCleaningReminderConfig());
      setPermission(getNotificationPermission());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCleaningReminderConfig(config);
    setStatusMessage({ type: "success", text: "Ayarlar başarıyla kaydedildi." });
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === "granted") {
        setStatusMessage({
          type: "success",
          text: "Bildirim izni verildi! Saat 12:00'de hatırlatıcılar gelecek.",
        });
      } else if (res === "denied") {
        setStatusMessage({
          type: "error",
          text: "Bildirim izni tarayıcı ayarlarından engellenmiş.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await sendCleaningReminderNotification(true);
      setStatusMessage({
        type: res.success ? "success" : "error",
        text: res.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isGranted = permission === "granted";
  const dueRooms = getDueRoomsForCleaning();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-600 dark:text-emerald-400">
              🔔
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Temizlik Bildirimi Ayarları
              </h3>
              <p className="text-xs text-muted">
                Temizlik günü gelen odalar için günlük bildirim
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised text-muted hover:text-foreground text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Permission Info */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-raised border border-border/60">
          <span className="text-xs font-semibold text-foreground">
            Cihaz Bildirim İzni:
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isGranted
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isGranted ? "✓ İzin Verildi" : "İzin Gerekli"}
          </span>
        </div>

        {!isGranted && (
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <span>🔔</span>
            <span>{loading ? "İzin İsteniyor..." : "Bildirim İznini Aç"}</span>
          </button>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Enable / Disable toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-raised/60 border border-border/50">
            <div>
              <span className="text-xs font-bold text-foreground block">
                Günlük Bildirimi Etkinleştir
              </span>
              <span className="text-[11px] text-muted block mt-0.5">
                Günü gelen odalar belirlenen saatte bildirilir
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Time Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Bildirim Saati
            </label>
            <input
              type="time"
              value={config.time}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, time: e.target.value }))
              }
              className="field font-semibold"
              required
            />
            <p className="text-[11px] text-muted">
              Varsayılan olarak her gün <strong>öğlen saat 12:00</strong>'de kontrol edilir.
            </p>
          </div>

          {/* Explanation Box */}
          <div className="p-3 rounded-2xl bg-surface-raised/40 border border-border/50 text-[11px] leading-relaxed text-muted space-y-1">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>💡</span> Bildirim nasıl görünecek?
            </div>
            <p className="italic text-foreground/80">
              "🧹 Temizlik Vakti Geldi! — Şu odalar temizlik bekliyor:{" "}
              {dueRooms.length > 0
                ? dueRooms.map((r) => r.room.name).join(", ")
                : "Salon, Mutfak"}"
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold border ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-2">
            {isGranted && (
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-2xl bg-surface-raised border border-border text-foreground hover:bg-border/40 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📲</span>
                <span>Şimdi Test Bildirimi Gönder</span>
              </button>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={onClose}
                className="secondary-button text-xs px-4"
              >
                Kapat
              </button>
              <button
                type="submit"
                className="primary-button text-xs px-5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              >
                Ayarları Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
