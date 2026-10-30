"use client";

import React, { useState, useEffect } from "react";
import {
  CLEANING_METHODS,
  CleaningMethodId,
  CleaningRoom,
} from "@/domain/cleaningTypes";
import { saveCleaningRecord } from "@/storage/cleaningStorage";
import { useProfile } from "@/context/ProfileContext";
import { CloseIcon } from "@/components/ui/Icons";

interface QuickCleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: CleaningRoom[];
  initialRoomId?: string;
  onOpenAddRoom?: () => void;
}

export function QuickCleanModal({
  isOpen,
  onClose,
  rooms,
  initialRoomId,
  onOpenAddRoom,
}: QuickCleanModalProps) {
  const { activeProfile, profiles } = useProfile();

  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedMethods, setSelectedMethods] = useState<CleaningMethodId[]>([
    "vacuum",
    "mop",
  ]);
  const [cleanedBy, setCleanedBy] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialRoomId) {
        setSelectedRoomId(initialRoomId);
      } else if (rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(rooms[0].id);
      }
      setSelectedDate(getTodayStr());
      setErrorMsg(null);
      if (activeProfile?.firstName) {
        setCleanedBy(activeProfile.firstName);
      }
    }
  }, [isOpen, initialRoomId, rooms, activeProfile]);

  if (!isOpen) return null;

  const toggleMethod = (methodId: CleaningMethodId) => {
    setErrorMsg(null);
    setSelectedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((id) => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    if (selectedMethods.length === 0) {
      setErrorMsg("Lütfen en az bir temizlik yöntemi seçin (örn: Süpürüldü, Paspas veya Robot Süpürge).");
      return;
    }

    const room = rooms.find((r) => r.id === selectedRoomId);
    if (!room) return;

    saveCleaningRecord({
      roomId: room.id,
      roomName: room.name,
      date: selectedDate,
      methods: selectedMethods,
      cleanedBy: cleanedBy.trim() || undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-lg space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/70 border border-border-lavender text-primary text-xl">
              🧹
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Temizlik Kaydı Ekle
              </h2>
              <p className="text-xs text-muted">
                Oda, temizlik yöntemi ve tarih seçin
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

        <form onSubmit={handleSave} className="space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* 1. Oda Seçimi */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              1. Temizlenen Oda
            </label>
            {rooms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-raised p-4 text-center space-y-2">
                <p className="text-xs text-muted">
                  Henüz kayıtlı bir oda bulunmuyor. Temizlik kaydetmek için lütfen önce oda ekleyin.
                </p>
                {onOpenAddRoom && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddRoom();
                    }}
                    className="primary-button text-xs px-3.5 py-1.5"
                  >
                    + Şimdi Oda Ekle
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {rooms.map((r) => {
                  const isSelected = r.id === selectedRoomId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoomId(r.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? "border-primary bg-accent/60 text-primary font-bold"
                          : "border-border bg-surface-raised hover:bg-background-subtle text-foreground font-medium"
                      }`}
                    >
                      <span className="text-2xl mb-1">{r.icon}</span>
                      <span className="text-xs truncate w-full">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Tarih Seçimi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                2. Temizlik Tarihi
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayStr())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedDate === getTodayStr()
                      ? "bg-primary text-white"
                      : "bg-surface-raised border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getYesterdayStr())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedDate === getYesterdayStr()
                      ? "bg-primary text-white"
                      : "bg-surface-raised border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Dün
                </button>
              </div>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="field font-medium tabular-nums"
              required
            />
          </div>

          {/* 3. Ne İle Temizlendi? (Yöntemler) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                3. Ne İle Temizlendi? (Birden Fazla Seçilebilir)
              </label>
              <span className="ds-badge ds-badge-primary text-[10px]">
                {selectedMethods.length} Seçili
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CLEANING_METHODS.map((method) => {
                const isChecked = selectedMethods.includes(method.id);
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => toggleMethod(method.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isChecked
                        ? "border-primary bg-accent/50 text-foreground font-semibold"
                        : "border-border bg-surface-raised hover:bg-background-subtle text-foreground font-normal"
                    }`}
                  >
                    <span className="text-xl flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface border border-border shadow-2xs">
                      {method.icon}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold leading-tight">
                        {method.label}
                      </span>
                      <span className="text-[10px] text-muted truncate mt-0.5">
                        {method.description}
                      </span>
                    </div>
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                        isChecked
                          ? "bg-primary text-white"
                          : "border border-border-strong bg-surface text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Kim Temizledi & Not (Opsiyonel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted">Kim Temizledi?</label>
              {profiles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profiles.map((p) => {
                    const isSelected = cleanedBy === p.firstName;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCleanedBy(isSelected ? "" : p.firstName)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "bg-surface-raised text-foreground border-border hover:bg-background-subtle"
                        }`}
                      >
                        👤 {p.firstName}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Örn: Mert, Birlikte..."
                  value={cleanedBy}
                  onChange={(e) => setCleanedBy(e.target.value)}
                  className="field text-xs"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted">Not (Opsiyonel)</label>
              <input
                type="text"
                placeholder="Örn: Halı da silindi..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="field text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button text-xs px-4 py-2"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="primary-button text-xs px-5 py-2"
            >
              <span>✓</span>
              <span>Temizliği Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
