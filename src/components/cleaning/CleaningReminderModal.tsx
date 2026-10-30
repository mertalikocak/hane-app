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
  type NotificationPermissionState,
} from "@/lib/notifications/notificationService";
import { CloseIcon } from "@/components/ui/Icons";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/70 border border-border-lavender text-xl text-primary">
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
            className="icon-button h-8 w-8"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Permission Info */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
          <span className="text-xs font-semibold text-foreground">
            Cihaz Bildirim İzni:
          </span>
          <span
            className={`ds-badge ${
              isGranted ? "ds-badge-success" : "ds-badge-warning"
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
            className="primary-button w-full py-2.5 text-xs"
          >
            <span>🔔</span>
            <span>{loading ? "İzin İsteniyor..." : "Bildirim İznini Aç"}</span>
          </button>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Enable / Disable toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
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
              <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
              className="field font-semibold tabular-nums"
              required
            />
            <p className="text-[11px] text-muted">
              Varsayılan olarak her gün <strong>öğlen saat 12:00</strong>&apos;de kontrol edilir.
            </p>
          </div>

          {/* Explanation Box */}
          <div className="ds-card-lavender p-3 text-[11px] leading-relaxed text-foreground-secondary space-y-1">
            <div className="font-bold text-primary flex items-center gap-1.5">
              <span>💡</span> Bildirim nasıl görünecek?
            </div>
            <p className="italic">
              &quot;🧹 Temizlik Vakti Geldi! — Şu odalar temizlik bekliyor:{" "}
              {dueRooms.length > 0
                ? dueRooms.map((r) => r.room.name).join(", ")
                : "Salon, Mutfak"}&quot;
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-700"
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
                className="secondary-button w-full py-2.5 text-xs"
              >
                <span>📲</span>
                <span>Şimdi Test Bildirimi Gönder</span>
              </button>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="secondary-button text-xs px-4 py-2"
              >
                Kapat
              </button>
              <button
                type="submit"
                className="primary-button text-xs px-5 py-2"
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
