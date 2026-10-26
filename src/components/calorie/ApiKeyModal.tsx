"use client";

import React, { useState, useEffect } from "react";
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from "@/storage/calorieStorage";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredGeminiApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredGeminiApiKey(apiKey);
    setSavedSuccess(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setStoredGeminiApiKey("");
    setApiKey("");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg font-bold">
              🔑
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Gemini API Anahtarı
              </h2>
              <p className="text-xs text-muted">
                Yapay zeka analizini kendi anahtarınızla çalıştırın
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground/90 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <span>💡</span> Nasıl ücretsiz anahtar alırım?
            </div>
            <p>
              Google AI Studio üzerinden Google hesabınızla saniyeler içinde ücretsiz API anahtarı alabilirsiniz. Kredi kartı gerekmez.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline pt-1"
            >
              aistudio.google.com/app/apikey ↗
            </a>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>API Anahtarınız (AIzaSy...)</span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-muted hover:text-foreground cursor-pointer"
              >
                {showKey ? "Gizle" : "Göster"}
              </button>
            </label>
            <input
              type={showKey ? "text" : "password"}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none transition font-mono"
            />
            <p className="text-[11px] text-muted">
              Bu anahtar yalnızca sizin tarayıcınızda saklanır ve doğrudan Gemini API ile iletişim kurmak için kullanılır.
            </p>
          </div>

          {savedSuccess && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-500 text-center">
              ✓ API Anahtarı başarıyla kaydedildi!
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/70">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1.5 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
            >
              Anahtarı Temizle
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition cursor-pointer"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
