"use client";

import React, { useState, useEffect } from "react";
import {
  CLEANING_METHODS,
  CleaningMethodId,
  CleaningRoom,
} from "@/domain/cleaningTypes";
import { saveCleaningRecord } from "@/storage/cleaningStorage";
import { useProfile } from "@/context/ProfileContext";

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

  useEffect(() => {
    if (isOpen) {
      if (initialRoomId) {
        setSelectedRoomId(initialRoomId);
      } else if (rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(rooms[0].id);
      }
      setSelectedDate(getTodayStr());
      // Default cleanedBy to current profile
      if (activeProfile?.firstName) {
        setCleanedBy(activeProfile.firstName);
      }
    }
  }, [isOpen, initialRoomId, rooms, activeProfile]);

  if (!isOpen) return null;

  const toggleMethod = (methodId: CleaningMethodId) => {
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
      alert("Lütfen en az bir temizlik yöntemi seçin (örn: Süpürüldü, Paspas veya Robot Süpürge).");
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

  const currentRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl shadow-md text-white">
              🧹
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground">
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
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-raised hover:bg-border/60 text-muted hover:text-foreground text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Oda Seçimi */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              1. Temizlenen Oda
            </label>
            {rooms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-surface-raised/60 p-4 text-center space-y-2">
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
                    className="primary-button text-xs px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
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
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs font-bold ring-2 ring-primary/20"
                          : "border-border/70 bg-surface-raised hover:bg-border/30 text-foreground/80 font-medium"
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
                      : "bg-surface-raised text-muted hover:text-foreground"
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
                      : "bg-surface-raised text-muted hover:text-foreground"
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
              className="field w-full font-medium"
              required
            />
          </div>

          {/* 3. Ne İle Temizlendi? (Yöntemler) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                3. Ne İle Temizlendi? (Birden Fazla Seçilebilir)
              </label>
              <span className="text-[11px] text-muted font-medium">
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
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isChecked
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
                        : "border-border/60 bg-surface-raised hover:bg-border/30 text-foreground/80 font-normal"
                    }`}
                  >
                    <span className="text-xl flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/60 shadow-xs">
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
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 font-black ${
                        isChecked
                          ? "bg-emerald-500 text-white"
                          : "border border-border text-transparent"
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
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "bg-surface-raised text-foreground/80 border-border hover:bg-border/30"
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button text-xs px-4"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="primary-button text-xs px-6 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
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
