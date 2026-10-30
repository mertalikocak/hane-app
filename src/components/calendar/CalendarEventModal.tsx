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
import { CalendarIcon, CloseIcon, TrashIcon } from "@/components/ui/Icons";

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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    setConfirmDelete(false);
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

  const executeDelete = () => {
    if (!initialEvent?.id) return;
    deleteCalendarEvent(initialEvent.id);
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-primary">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">
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
            className="icon-button h-9 w-9"
            aria-label="Kapat"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Başlık (Zorunlu) */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Etkinlik Başlığı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Diş Randevusu / Sinema Gecesi"
              className="field w-full"
            />
            {errors.title && (
              <span className="text-xs text-danger mt-1 block">
                {errors.title}
              </span>
            )}
          </div>

          {/* Scope (Ortak vs Kişisel) */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Etkinlik Kapsamı *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope("common")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  scope === "common"
                    ? "border-primary bg-surface-lavender text-primary shadow-2xs"
                    : "border-border bg-surface hover:bg-surface-raised text-foreground-secondary"
                }`}
              >
                <span>Ortak (Tüm Hane)</span>
              </button>

              <button
                type="button"
                onClick={() => setScope("personal")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  scope === "personal"
                    ? "border-primary bg-surface-lavender text-primary shadow-2xs"
                    : "border-border bg-surface hover:bg-surface-raised text-foreground-secondary"
                }`}
              >
                <span>Kişisel</span>
              </button>
            </div>

            <span className="text-[11px] text-muted block mt-1.5">
              {scope === "common"
                ? "Tüm hane üyeleri bu ortak etkinliği takvimlerinde görür."
                : `Kişisel etkinlik (${activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : "Aktif Profil"}) adına kaydedilecektir.`}
            </span>
          </div>

          {/* Tarih Seçimi */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
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
                  <span className="text-xs text-danger mt-1 block">
                    {errors.date}
                  </span>
                )}
              </div>

              {hasEndDate && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
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
                    <span className="text-xs text-danger mt-1 block">
                      {errors.endDate}
                    </span>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (e.target.checked && !endDate) setEndDate(date);
                }}
                className="rounded border-border-strong text-primary focus:ring-primary/20 h-4 w-4"
              />
              <span>Çok günlük etkinlik (Bitiş tarihi ekle)</span>
            </label>
          </div>

          {/* Saat & Tüm Gün */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded border-border-strong text-primary focus:ring-primary/20 h-4 w-4"
              />
              <span>Tüm Gün Etkinliği</span>
            </label>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
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
                  <label className="block text-xs font-semibold text-foreground mb-1">
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
            <label className="block text-xs font-semibold text-foreground mb-1.5">
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
                        : "border-border bg-surface hover:bg-surface-raised text-foreground-secondary"
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
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notlar, adres, hatırlatmalar vb."
              className="field w-full text-xs py-2.5 h-auto"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-border">
            {initialEvent ? (
              confirmDelete ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger-soft px-2.5 py-1">
                  <span className="text-xs font-semibold text-danger">Silinsin mi?</span>
                  <button
                    type="button"
                    onClick={executeDelete}
                    className="rounded-lg bg-danger px-2 py-1 text-xs font-bold text-white cursor-pointer"
                  >
                    Evet
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-foreground-secondary hover:bg-surface cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="danger-button h-10 px-3.5 text-xs"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Sil</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="secondary-button h-10 px-4 text-xs"
              >
                İptal
              </button>
              <button
                type="submit"
                className="primary-button h-10 px-5 text-xs"
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
