"use client";

import React, { useState, useEffect } from "react";
import {
  WishlistItem,
  WishlistPriority,
  WishlistCategory,
  WISHLIST_CATEGORIES,
} from "@/domain/wishlistTypes";
import { saveWishlistItem, deleteWishlistItem } from "@/storage/wishlistStorage";
import { useProfile } from "@/context/ProfileContext";
import { CloseIcon } from "@/components/ui/Icons";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: WishlistItem | null;
  defaultSection?: string;
  onSaved?: () => void;
}

export function WishlistModal({
  isOpen,
  onClose,
  initialItem,
  defaultSection = "hane",
  onSaved,
}: WishlistModalProps) {
  const { profiles, activeProfile } = useProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [targetSection, setTargetSection] = useState<string>("hane");
  const [priority, setPriority] = useState<WishlistPriority>("medium");
  const [category, setCategory] = useState<WishlistCategory>("home");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialItem) {
      setTitle(initialItem.title);
      setDescription(initialItem.description || "");
      setPrice(initialItem.price ? initialItem.price.toString() : "");
      setUrl(initialItem.url || "");
      setTargetSection(initialItem.targetSection || "hane");
      setPriority(initialItem.priority || "medium");
      setCategory(initialItem.category || "home");
    } else {
      setTitle("");
      setDescription("");
      setPrice("");
      setUrl("");
      setTargetSection(defaultSection || (activeProfile ? activeProfile.id : "hane"));
      setPriority("medium");
      setCategory("home");
    }
    setErrors({});
    setConfirmDelete(false);
  }, [isOpen, initialItem, defaultSection, activeProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Lütfen bir istek veya ürün adı giriniz.";
    }

    let parsedPrice: number | undefined = undefined;
    if (price.trim()) {
      const p = parseFloat(price.replace(",", "."));
      if (isNaN(p) || p < 0) {
        newErrors.price = "Geçerli bir tutar giriniz.";
      } else {
        parsedPrice = p;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const creatorId = activeProfile ? activeProfile.id : "prof_default";
    const creatorName = activeProfile
      ? `${activeProfile.firstName} ${activeProfile.lastName}`.trim()
      : "Hane";

    saveWishlistItem({
      id: initialItem?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      price: parsedPrice,
      url: url.trim() || undefined,
      targetSection,
      priority,
      category,
      completed: initialItem?.completed ?? false,
      createdByProfileId: initialItem?.createdByProfileId || creatorId,
      createdByName: initialItem?.createdByName || creatorName,
    });

    onSaved?.();
    onClose();
  };

  const handleConfirmDelete = () => {
    if (!initialItem?.id) return;
    deleteWishlistItem(initialItem.id);
    setConfirmDelete(false);
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/70 border border-border-lavender text-primary text-xl">
              🎁
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">
                {initialItem ? "İsteği Düzenle" : "Yeni İstek Ekle"}
              </h3>
              <p className="text-xs text-muted">
                {initialItem ? "Wish list detaylarını güncelleyin" : "Hane veya kendiniz için istek listesine ekleyin"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Section (Hane vs Aktif Profil) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              İstek Kapsamı *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetSection("hane")}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  targetSection === "hane"
                    ? "border-primary bg-accent/60 text-primary"
                    : "border-border bg-surface-raised hover:bg-background-subtle text-muted"
                }`}
              >
                <span>🏠</span>
                <span>Hane (Ortak)</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetSection(activeProfile ? activeProfile.id : (profiles[0]?.id || "prof_default"))}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  targetSection !== "hane"
                    ? "border-primary bg-accent/60 text-primary"
                    : "border-border bg-surface-raised hover:bg-background-subtle text-muted"
                }`}
              >
                <span>👤</span>
                <span>Kişisel ({activeProfile ? activeProfile.firstName : "Profilim"})</span>
              </button>
            </div>

            <span className="text-[11px] text-muted block mt-1.5">
              {targetSection === "hane"
                ? "👥 Tüm hane halkı için ortak istek listesine eklenir."
                : `👤 ${activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : "Aktif profiliniz"} adına istek listesine eklenir.`}
            </span>
          </div>

          {/* Başlık (Zorunlu) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              İstek / Ürün Adı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Robot Süpürge, Koşu Ayakkabısı, Kahve Makinesi..."
              className={`field text-xs sm:text-sm ${errors.title ? "field-error" : ""}`}
            />
            {errors.title && (
              <span className="text-[11px] text-rose-600 mt-1 block">
                {errors.title}
              </span>
            )}
          </div>

          {/* Fiyat & Öncelik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Tahmini Fiyat (₺) (Opsiyonel)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={`field text-xs sm:text-sm tabular-nums ${errors.price ? "field-error" : ""}`}
              />
              {errors.price && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errors.price}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Öncelik
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WishlistPriority)}
                className="field text-xs sm:text-sm"
              >
                <option value="low">🟢 Düşük Öncelik</option>
                <option value="medium">🟡 Normal / Orta</option>
                <option value="high">🔴 Yüksek Öncelik</option>
              </select>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Kategori
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(WISHLIST_CATEGORIES).map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? `${cat.bgClass} ${cat.textClass} ${cat.borderClass} ring-1 ring-primary/30`
                        : "border-border bg-surface-raised hover:bg-background-subtle text-muted"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ürün Linki (URL) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Ürün Linki / Web Sitesi (Opsiyonel)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.hepsiburada.com/..."
              className="field text-xs"
            />
          </div>

          {/* Açıklama / Notlar */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Açıklama / Notlar (Opsiyonel)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beden, renk, model no veya alınacak yer gibi detaylar..."
              className="field min-h-[64px] py-2 text-xs resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-border">
            {initialItem ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 text-xs"
                  >
                    Silmeyi Onayla
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="secondary-button px-2.5 py-1.5 text-xs"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="danger-button px-3.5 py-2 text-xs"
                >
                  Sil
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
                {initialItem ? "Güncelle" : "İsteği Ekle"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
