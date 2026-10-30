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
} from "@/lib/notifications/notificationService";
import { ClockIcon, CloseIcon, UtensilsIcon } from "@/components/ui/Icons";

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
          ? `✓ Akşam yemeği bildirimi her gün saat ${config.time} için ayarlandı.`
          : "✓ Akşam yemeği bildirimi kapatıldı.",
      });

      setTimeout(() => {
        onClose();
      }, 1000);
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
          text: "Bugünkü akşam yemeği menüsü bildirim olarak gönderildi.",
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
      <div
        className="fixed inset-0 bg-[#30263A]/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-[18px] bg-surface border border-border shadow-[var(--shadow-lg)] p-6 text-foreground z-10"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent border border-border-lavender text-primary">
              <ClockIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base tracking-tight text-foreground">
                Akşam Yemeği Bildirimi
              </h3>
              <p className="text-xs text-muted">
                Belirlediğiniz saatte o günün menüsünü bildirir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-8 w-8"
            aria-label="Kapat"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="p-3.5 rounded-[12px] bg-background border border-border">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UtensilsIcon className="h-3.5 w-3.5 text-primary" />
                <span>Bugünkü Menü:</span>
              </span>
              <span className="text-[11px] font-medium text-muted">
                {todayMeals.length > 0 ? `${todayMeals.length} Yemek Planlandı` : "Henüz Boş"}
              </span>
            </div>
            <p className="text-xs text-foreground-secondary">
              {todayMeals.length > 0
                ? todayMeals.map((m) => m.name).join(", ")
                : "Bugün için menü seçilmemiş. Bildirim geldiğinde menü boş uyarısı iletilir."}
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-[12px] bg-background border border-border">
            <div>
              <div className="font-semibold text-xs sm:text-sm text-foreground">
                Yemek Bildirimlerini Etkinleştir
              </div>
              <div className="text-xs text-muted">
                Her gün belirlenen saatte hatırlatma gönderilir
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border-strong peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Bildirim Saati
            </label>
            <input
              type="time"
              value={config.time}
              onChange={(e) => setConfig({ ...config, time: e.target.value })}
              className="field font-semibold tabular-nums"
            />

            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <span className="text-[11px] text-muted mr-1">Hazır:</span>
              {PRESET_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setConfig({ ...config, time: t })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                    config.time === t
                      ? "bg-accent border-border-lavender text-primary"
                      : "bg-background border-border text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-[10px] text-xs font-medium border ${
                statusMessage.type === "success"
                  ? "bg-success-bg border-success-border text-success"
                  : "bg-danger-bg border-danger-border text-danger"
              }`}
            >
              {statusMessage.text}
            </div>
          )}
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-border">
          <button
            type="button"
            onClick={handleSendInstantTest}
            disabled={loading}
            className="w-full sm:w-auto secondary-button text-xs py-2 px-3.5"
          >
            <span>Şimdi Test Et</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto secondary-button text-xs py-2 px-4"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="w-1/2 sm:w-auto primary-button text-xs py-2 px-5"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
