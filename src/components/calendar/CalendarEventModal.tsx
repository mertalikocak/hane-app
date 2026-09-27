"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarEvent,
  CalendarScope,
  CalendarCategory,
  CALENDAR_CATEGORIES,
} from "@/domain/calendarTypes";
import { saveCalendarEvent, deleteCalendarEvent } from "@/storage/calendarStorage";
import { useProfile } from "@/context/ProfileContext";

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialEvent?: CalendarEvent | null;
  onSaved?: () => void;
}

export function CalendarEventModal({
  isOpen,
  onClose,
  initialDate,
  initialEvent,
  onSaved,
}: CalendarEventModalProps) {
  const { profiles, activeProfile } = useProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [time, setTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [scope, setScope] = useState<CalendarScope>("common");
  const [category, setCategory] = useState<CalendarCategory>("default");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (initialEvent) {
      setTitle(initialEvent.title);
      setDescription(initialEvent.description || "");
      setDate(initialEvent.date);
      setHasEndDate(Boolean(initialEvent.endDate && initialEvent.endDate !== initialEvent.date));
      setEndDate(initialEvent.endDate || "");
      setIsAllDay(initialEvent.isAllDay);
      setTime(initialEvent.time || "12:00");
      setEndTime(initialEvent.endTime || "13:00");
      setScope(initialEvent.scope);
      setCategory(initialEvent.category || "default");
    } else {
      const todayStr = initialDate || new Date().toISOString().split("T")[0];
      setTitle("");
      setDescription("");
      setDate(todayStr);
      setHasEndDate(false);
      setEndDate(todayStr);
      setIsAllDay(true);
      setTime("12:00");
      setEndTime("13:00");
      setScope("common");
      setCategory("default");
    }
    setErrors({});
  }, [isOpen, initialEvent, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Lütfen etkinlik başlığı giriniz.";
    }
    if (!date) {
      newErrors.date = "Lütfen başlangıç tarihi seçiniz.";
    }
    if (hasEndDate && endDate && endDate < date) {
      newErrors.endDate = "Bitiş tarihi başlangıç tarihinden önce olamaz.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Determine target profile name & id if personal (always use active profile)
    let targetId: string | undefined = undefined;
    let targetName: string | undefined = undefined;
    if (scope === "personal") {
      const targetProf = activeProfile || (initialEvent?.targetProfileId ? profiles.find((p) => p.id === initialEvent.targetProfileId) : profiles[0]);
      targetId = targetProf?.id;
      targetName = targetProf ? `${targetProf.firstName} ${targetProf.lastName}`.trim() : undefined;
    }

    const creatorId = activeProfile ? activeProfile.id : (initialEvent?.createdByProfileId || "prof_default");
    const creatorName = activeProfile
      ? `${activeProfile.firstName} ${activeProfile.lastName}`.trim()
      : (initialEvent?.createdByName || "Hane");

    saveCalendarEvent({
      id: initialEvent?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      endDate: hasEndDate && endDate ? endDate : undefined,
      isAllDay,
      time: !isAllDay ? time : undefined,
      endTime: !isAllDay && endTime ? endTime : undefined,
      scope,
      targetProfileId: scope === "personal" ? targetId : undefined,
      targetProfileName: scope === "personal" ? targetName : undefined,
      createdByProfileId: initialEvent?.createdByProfileId || creatorId,
      createdByName: initialEvent?.createdByName || creatorName,
      category,
    });

    onSaved?.();
    onClose();
  };

  const handleDelete = () => {
    if (!initialEvent?.id) return;
    if (confirm(`"${initialEvent.title}" etkinliğini silmek istediğinize emin misiniz?`)) {
      deleteCalendarEvent(initialEvent.id);
      onSaved?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border/80 bg-surface/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xl shadow-xs">
              📅
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-foreground leading-tight">
                {initialEvent ? "Etkinliği Düzenle" : "Yeni Etkinlik Ekle"}
              </h3>
              <p className="text-xs text-muted">
                {initialEvent ? "Etkinlik detaylarını güncelleyin" : "Takvime ortak veya kişisel plan ekleyin"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-raised border border-border/60 text-muted hover:text-foreground text-xs cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Başlık (Zorunlu) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Etkinlik Başlığı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Diş Randevusu / Sinema Gecesi"
              className="field w-full font-medium"
            />
            {errors.title && (
              <span className="text-[11px] text-rose-500 mt-1 block">
                {errors.title}
              </span>
            )}
          </div>

          {/* Scope (Ortak vs Kişisel) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Etkinlik Kapsamı *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope("common")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  scope === "common"
                    ? "border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "border-border/80 bg-surface hover:bg-surface-raised text-muted"
                }`}
              >
                <span>👥</span>
                <span>Ortak (Tüm Hane)</span>
              </button>

              <button
                type="button"
                onClick={() => setScope("personal")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  scope === "personal"
                    ? "border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "border-border/80 bg-surface hover:bg-surface-raised text-muted"
                }`}
              >
                <span>👤</span>
                <span>Kişisel</span>
              </button>
            </div>

            <span className="text-[11px] text-muted block mt-1.5">
              {scope === "common"
                ? "👥 Tüm hane üyeleri bu ortak etkinliği takvimlerinde görür."
                : `👤 Kişisel etkinlik (${activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : "Aktif Profil"}) adına kaydedilecektir.`}
            </span>
          </div>

          {/* Tarih Seçimi */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Tarih *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="field w-full text-xs font-semibold"
                />
                {errors.date && (
                  <span className="text-[11px] text-rose-500 mt-1 block">
                    {errors.date}
                  </span>
                )}
              </div>

              {hasEndDate && (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={date}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="field w-full text-xs font-semibold"
                  />
                  {errors.endDate && (
                    <span className="text-[11px] text-rose-500 mt-1 block">
                      {errors.endDate}
                    </span>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (e.target.checked && !endDate) setEndDate(date);
                }}
                className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Çok günlük etkinlik (Bitiş tarihi ekle)</span>
            </label>
          </div>

          {/* Saat & Tüm Gün */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="font-bold">Tüm Gün Etkinliği</span>
            </label>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Başlangıç Saati
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="field w-full text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Bitiş Saati
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="field w-full text-xs font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Kategori Seçimi */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Etkinlik Türü / Kategori
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(CALENDAR_CATEGORIES).map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === "shift") {
                        setTitle("Nöbet");
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? `${cat.bgClass} ${cat.textClass} ${cat.borderClass} ring-1 ring-primary/30`
                        : "border-border/60 bg-surface hover:bg-surface-raised text-muted"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Açıklama (Opsiyonel) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notlar, adres, hatırlatmalar vb."
              className="field w-full text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/60">
            {initialEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
              >
                Sil
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl border border-border bg-surface hover:bg-surface-raised text-xs font-bold text-foreground transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="primary-button bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {initialEvent ? "Güncelle" : "Etkinliği Kaydet"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
