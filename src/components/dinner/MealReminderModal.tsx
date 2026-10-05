"use client";

import React, { useState, useEffect } from "react";
import {
  getMealReminderConfig,
  saveMealReminderConfig,
  sendMealMenuNotification,
  getTodayMeals,
  type MealReminderConfig,
} from "@/lib/notifications/mealNotificationService";
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
} from "@/lib/notifications/notificationService";

interface MealReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TIMES = ["18:00", "18:30", "19:00", "19:30", "20:00"];

export function MealReminderModal({ isOpen, onClose }: MealReminderModalProps) {
  const [config, setConfig] = useState<MealReminderConfig>({ enabled: false, time: "19:00" });
  const [permission, setPermission] = useState<string>("default");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getMealReminderConfig());
      setPermission(getNotificationPermission());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      if (config.enabled && permission !== "granted") {
        const req = await requestNotificationPermission();
        setPermission(req);
        if (req !== "granted") {
          setStatusMessage({
            type: "error",
            text: "Bildirim izni verilmedi. Lütfen tarayıcı ayarlarından bildirimlere izin verin.",
          });
          setLoading(false);
          return;
        }
      }

      saveMealReminderConfig(config);
      setStatusMessage({
        type: "success",
        text: config.enabled
          ? `✓ Akşam yemeği bildirimi her gün saat ${config.time}'a ayarlandı!`
          : "✓ Akşam yemeği bildirimi kapatıldı.",
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInstantTest = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      if (permission !== "granted") {
        const req = await requestNotificationPermission();
        setPermission(req);
        if (req !== "granted") {
          setStatusMessage({
            type: "error",
            text: "Bildirim izni verilmedi. Bildirim gönderilemedi.",
          });
          return;
        }
      }

      const success = await sendMealMenuNotification();
      if (success) {
        setStatusMessage({
          type: "success",
          text: "📲 Bugünkü akşam yemeği menüsü bildirim olarak telefonunuza gönderildi!",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: "Bildirim gönderilemedi. Lütfen tarayıcı izinlerini kontrol edin.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const todayMeals = getTodayMeals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl p-6 text-foreground animate-in zoom-in-95 duration-200 z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 text-xl border border-amber-500/20">
              🔔
            </span>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Akşam Yemeği Bildirimi</h3>
              <p className="text-xs text-muted">Belirlediğiniz saatte o günün menüsünü bildirir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-raised border border-border/80 text-muted hover:text-foreground text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5">
          {/* Today's Menu Preview */}
          <div className="p-3.5 rounded-2xl bg-surface-raised border border-border/70">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span>🍽️</span> Bugünkü Menü:
              </span>
              <span className="text-[11px] text-muted">
                {todayMeals.length > 0 ? `${todayMeals.length} Yemek Planlandı` : "Henüz Boş"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {todayMeals.length > 0
                ? todayMeals.map((m) => m.name).join(", ")
                : "Bugün için menü seçilmemiş. Bildirim geldiğinde menü boş uyarısı iletilir."}
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised border border-border/70">
            <div>
              <div className="font-bold text-sm">Yemek Bildirimlerini Etkinleştir</div>
              <div className="text-xs text-muted">Her gün belirlenen saatte Android bildirimi gelir</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Bildirim Saati
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={config.time}
                onChange={(e) => setConfig({ ...config, time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-raised border border-border font-bold text-base text-foreground focus:ring-2 focus:ring-amber-500/30 focus:outline-hidden"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-muted mr-1">Hazır:</span>
              {PRESET_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setConfig({ ...config, time: t })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    config.time === t
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-500 font-bold"
                      : "bg-surface-raised border-border/70 text-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-medium border animate-in fade-in duration-150 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400"
              }`}
            >
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-border/70">
          <button
            type="button"
            onClick={handleSendInstantTest}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-border bg-surface-raised hover:bg-border/40 text-xs font-bold text-foreground transition cursor-pointer flex items-center justify-center gap-1.5"
            title="Bugünün akşam yemeği menüsünü anında telefonunuza gönderin"
          >
            <span>📲</span>
            <span>Şimdi Test Et</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-2xl border border-border bg-surface hover:bg-surface-raised text-xs font-bold text-foreground transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
