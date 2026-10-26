"use client";

import React, { useState, useEffect } from "react";
import { setCustomTarget } from "@/storage/calorieStorage";

interface EditTargetModalProps {
  isOpen: boolean;
  profileId: string;
  currentTarget: number;
  suggestedTarget: number;
  onClose: () => void;
  onTargetUpdated: () => void;
}

export function EditTargetModal({
  isOpen,
  profileId,
  currentTarget,
  suggestedTarget,
  onClose,
  onTargetUpdated,
}: EditTargetModalProps) {
  const [target, setTarget] = useState(String(currentTarget));

  useEffect(() => {
    if (isOpen) {
      setTarget(String(currentTarget));
    }
  }, [isOpen, currentTarget]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(target, 10);
    if (val && val > 500 && val < 10000) {
      setCustomTarget(profileId, val);
      onTargetUpdated();
      onClose();
    }
  };

  const handleUseSuggested = () => {
    setTarget(String(suggestedTarget));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary text-base">
              🎯
            </span>
            <h3 className="text-sm font-bold text-foreground">
              Günlük Kalori Hedefi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Hedef Kalori (kcal/gün)
            </label>
            <input
              type="number"
              min="500"
              max="9999"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-raised px-4 py-3 text-lg font-black text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface-raised/60 p-3 space-y-1.5 text-xs">
            <div className="text-muted flex justify-between">
              <span>Hane Fit Önerisi:</span>
              <span className="font-bold text-foreground">{suggestedTarget} kcal</span>
            </div>
            <button
              type="button"
              onClick={handleUseSuggested}
              className="text-primary font-bold hover:underline text-[11px] cursor-pointer"
            >
              Önerilen Hedefi Kullan ({suggestedTarget} kcal)
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:text-foreground cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover cursor-pointer"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
