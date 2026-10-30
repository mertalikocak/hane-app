"use client";

import React, { useState } from "react";
import { addCleaningRoom } from "@/storage/cleaningStorage";
import { CloseIcon } from "@/components/ui/Icons";

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_ICONS = ["🛋️", "🛏️", "🍳", "🚿", "🚪", "💻", "🌿", "🧸", "🧺", "📦", "☀️", "🚗"];

export function AddRoomModal({ isOpen, onClose }: AddRoomModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🛋️");
  const [interval, setInterval] = useState("3");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCleaningRoom({
      name: name.trim(),
      icon,
      targetDaysInterval: parseInt(interval, 10) || 3,
    });

    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/70 border border-border-lavender text-xl text-primary">
              🏠
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Yeni Oda Ekle</h3>
              <p className="text-xs text-muted">Temizlik takip listenize yeni bir alan ekleyin</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Oda / Alan Adı
            </label>
            <input
              type="text"
              placeholder="Örn: Çamaşır Odası, Kiler, Teras..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              İkon Seçimi
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition cursor-pointer ${
                    icon === ic
                      ? "border-primary bg-accent/70 ring-2 ring-primary/20"
                      : "border-border bg-surface-raised hover:bg-background-subtle"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Temizlik Sıklığı (Kaç günde bir?)
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="field"
            >
              <option value="1">Her gün (1 günde bir)</option>
              <option value="2">2 günde bir</option>
              <option value="3">3 günde bir (Standart)</option>
              <option value="4">4 günde bir</option>
              <option value="7">Haftada bir (7 günde bir)</option>
              <option value="14">2 haftada bir (14 gün)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button type="button" onClick={onClose} className="secondary-button text-xs px-4 py-2">
              Vazgeç
            </button>
            <button type="submit" className="primary-button text-xs px-5 py-2">
              Odayı Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
