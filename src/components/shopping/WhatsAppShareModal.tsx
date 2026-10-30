"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { WhatsAppIcon, CloseIcon, CheckIcon } from "@/components/ui/Icons";
import type { ShoppingCustomItem } from "@/domain/shoppingTypes";
import type { LocalShoppingItem } from "@/lib/local-storage/store";
import { addWeeks } from "@/lib/date/week";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart?: string;
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

  // Generate message text
  const messageText = useMemo(() => {
    const lines: string[] = [];
    const todayFormatted = new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    lines.push(`🛒 *HANE ALIŞVERİŞ LİSTESİ*`);
    lines.push(`📅 ${todayFormatted}`);
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
  }, [includeCustom, includeFood, onlyUncompleted, customItems, foodItems]);

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
      } catch {
        // user cancelled or share failed
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success border border-success/25">
              <WhatsAppIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                WhatsApp ile Paylaş
              </h2>
              <p className="text-xs text-muted">
                Listeyi formatlanmış metin olarak gönderin veya kopyalayın
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Kapat"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Options */}
          <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block">
              Paylaşım Seçenekleri
            </span>

            {/* Inclusions */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCustom}
                  onChange={(e) => setIncludeCustom(e.target.checked)}
                  className="rounded border-border-strong text-primary focus:ring-primary/20 h-4 w-4"
                />
                <span>Genel Alışveriş ({customItems.length})</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeFood}
                  onChange={(e) => setIncludeFood(e.target.checked)}
                  className="rounded border-border-strong text-primary focus:ring-primary/20 h-4 w-4"
                />
                <span>Yemek Malzemeleri ({foodItems.length})</span>
              </label>
            </div>

            {/* Filter */}
            <div className="pt-2.5 border-t border-border flex flex-wrap items-center gap-4 text-xs text-foreground-secondary">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <input
                  type="radio"
                  name="filter"
                  checked={onlyUncompleted}
                  onChange={() => setOnlyUncompleted(true)}
                  className="text-primary focus:ring-primary/20 h-3.5 w-3.5"
                />
                <span>Sadece Alınacaklar (Eksikler)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <input
                  type="radio"
                  name="filter"
                  checked={!onlyUncompleted}
                  onChange={() => setOnlyUncompleted(false)}
                  className="text-primary focus:ring-primary/20 h-3.5 w-3.5"
                />
                <span>Tüm Liste (Alınanlar Dahil)</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold text-foreground">Mesaj Önizlemesi</span>
              <span>WhatsApp biçimlendirmesi</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-background border border-border text-xs text-foreground font-mono whitespace-pre-wrap max-h-56 overflow-y-auto select-all leading-relaxed">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-raised flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:flex-1 h-10 px-4 rounded-xl bg-success hover:opacity-90 text-white font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>WhatsApp&apos;ta Gönder</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="secondary-button flex-1 sm:flex-initial h-10 px-4 text-xs"
            >
              {isCopied ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : null}
              <span>{isCopied ? "Kopyalandı!" : "Metni Kopyala"}</span>
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="secondary-button h-10 px-3 text-xs"
                title="Cihaz paylaşım menüsünü aç"
              >
                Paylaş
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
