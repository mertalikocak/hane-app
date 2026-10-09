"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { WhatsAppIcon, CloseIcon } from "@/components/ui/Icons";
import type { ShoppingCustomItem } from "@/domain/shoppingTypes";
import type { LocalShoppingItem } from "@/lib/local-storage/store";
import { addWeeks } from "@/lib/date/week";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: string;
  customItems: ShoppingCustomItem[];
  foodItems: LocalShoppingItem[];
}

function formatDisplayDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
    }).format(new Date(`${dateStr}T00:00:00.000Z`));
  } catch {
    return dateStr;
  }
}

export function WhatsAppShareModal({
  isOpen,
  onClose,
  weekStart,
  customItems,
  foodItems,
}: WhatsAppShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [includeCustom, setIncludeCustom] = useState(true);
  const [includeFood, setIncludeFood] = useState(true);
  const [onlyUncompleted, setOnlyUncompleted] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const weekEnd = useMemo(() => addWeeks(weekStart, 1), [weekStart]);

  // Generate message text
  const messageText = useMemo(() => {
    const lines: string[] = [];
    const dateRangeStr = `${formatDisplayDate(weekStart)} – ${formatDisplayDate(weekEnd)}`;

    lines.push(`🛒 *HANE ALIŞVERİŞ LİSTESİ*`);
    lines.push(`📅 ${dateRangeStr}`);
    lines.push(``);

    let hasAnyItem = false;

    // 1. Custom items
    if (includeCustom) {
      const filteredCustom = customItems.filter((item) =>
        onlyUncompleted ? !item.isCompleted : true
      );

      if (filteredCustom.length > 0) {
        hasAnyItem = true;
        lines.push(`📦 *Genel İhtiyaçlar & Alışveriş (${filteredCustom.length} ürün):*`);
        filteredCustom.forEach((item) => {
          const checkMark = onlyUncompleted ? "•" : item.isCompleted ? "✅" : "▫️";
          const qty = item.quantity ? ` (${item.quantity})` : "";
          const note = item.note ? ` _[${item.note}]_` : "";
          lines.push(`${checkMark} ${item.title}${qty}${note}`);
        });
        lines.push(``);
      }
    }

    // 2. Food items
    if (includeFood) {
      const filteredFood = foodItems.filter((item) =>
        onlyUncompleted ? !item.isCompleted : true
      );

      if (filteredFood.length > 0) {
        hasAnyItem = true;
        lines.push(`🥗 *Yemek Malzemeleri (${filteredFood.length} ürün):*`);
        filteredFood.forEach((item) => {
          const checkMark = onlyUncompleted ? "•" : item.isCompleted ? "✅" : "▫️";
          const qty = item.quantity > 0 ? ` (${item.quantity} ${item.unit})` : "";
          lines.push(`${checkMark} ${item.ingredientName}${qty}`);
        });
        lines.push(``);
      }
    }

    if (!hasAnyItem) {
      lines.push(`_(Seçilen kriterlere uygun ürün bulunmuyor)_`);
      lines.push(``);
    }

    lines.push(`✨ _Hane App üzerinden gönderildi_`);

    return lines.join("\n");
  }, [includeCustom, includeFood, onlyUncompleted, customItems, foodItems, weekStart, weekEnd]);

  if (!mounted || !isOpen) return null;

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank");
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(messageText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (e) {
      console.error("Clipboard copy error", e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hane Alışveriş Listesi",
          text: messageText,
        });
      } catch (e) {
        // user cancelled or share failed
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/70 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white font-bold text-xl shadow-sm shadow-emerald-500/20">
              <WhatsAppIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                WhatsApp ile Paylaş
              </h2>
              <p className="text-xs text-muted">
                Listeyi şık formatlanmış metin olarak gönderin veya kopyalayın
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface-raised text-muted hover:text-foreground transition cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Options */}
          <div className="p-4 rounded-2xl bg-surface-raised/60 border border-border/60 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Paylaşım Seçenekleri
            </span>

            {/* Inclusions */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-foreground">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCustom}
                  onChange={(e) => setIncludeCustom(e.target.checked)}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500/20 h-4 w-4"
                />
                <span>Genel Alışveriş ({customItems.length})</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeFood}
                  onChange={(e) => setIncludeFood(e.target.checked)}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500/20 h-4 w-4"
                />
                <span>Yemek Malzemeleri ({foodItems.length})</span>
              </label>
            </div>

            {/* Filter */}
            <div className="pt-2 border-t border-border/40 flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <input
                  type="radio"
                  name="filter"
                  checked={onlyUncompleted}
                  onChange={() => setOnlyUncompleted(true)}
                  className="text-emerald-600 focus:ring-emerald-500/20 h-3.5 w-3.5"
                />
                <span>Sadece Alınacaklar (Eksikler)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <input
                  type="radio"
                  name="filter"
                  checked={!onlyUncompleted}
                  onChange={() => setOnlyUncompleted(false)}
                  className="text-emerald-600 focus:ring-emerald-500/20 h-3.5 w-3.5"
                />
                <span>Tüm Liste (Alınanlar Dahil)</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold text-foreground">Mesaj Önizlemesi:</span>
              <span>WhatsApp uyumlu biçimlendirme</span>
            </div>
            <pre className="p-3.5 rounded-2xl bg-surface-raised border border-border text-xs text-foreground font-mono whitespace-pre-wrap max-h-56 overflow-y-auto select-all leading-relaxed">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border/70 bg-surface/95 backdrop-blur-md flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <WhatsAppIcon className="w-5 h-5" />
            <span>WhatsApp'ta Gönder</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial py-3 px-4 rounded-2xl border border-border bg-surface-raised hover:bg-border/50 text-foreground font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{isCopied ? "✓" : "📋"}</span>
              <span>{isCopied ? "Kopyalandı!" : "Metni Kopyala"}</span>
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-3 px-3.5 rounded-2xl border border-border bg-surface-raised hover:bg-border/50 text-foreground font-bold text-xs transition cursor-pointer"
                title="Cihaz paylaşım menüsünü aç"
              >
                📲
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
