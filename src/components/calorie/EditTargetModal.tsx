"use client";

import React, { useState, useEffect } from "react";
import { setCustomTarget } from "@/storage/calorieStorage";
import { CloseIcon } from "@/components/ui/Icons";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/70 border border-border-lavender text-primary text-base">
              🎯
            </span>
            <h3 className="text-sm font-bold text-foreground">
              Günlük Kalori Hedefi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-8 w-8"
          >
            <CloseIcon size={15} />
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
              className="field text-lg font-bold tabular-nums"
            />
          </div>

          <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-1.5 text-xs">
            <div className="text-muted flex justify-between">
              <span>Hane Fit Önerisi:</span>
              <span className="font-bold text-foreground tabular-nums">{suggestedTarget} kcal</span>
            </div>
            <button
              type="button"
              onClick={handleUseSuggested}
              className="text-primary font-bold hover:underline text-[11px] cursor-pointer"
            >
              Önerilen Hedefi Kullan ({suggestedTarget} kcal)
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button px-4 py-2 text-xs"
            >
              İptal
            </button>
            <button
              type="submit"
              className="primary-button px-5 py-2 text-xs"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
