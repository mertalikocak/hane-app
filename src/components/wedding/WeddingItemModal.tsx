"use client";

import { useState, useEffect } from "react";
import { WeddingItem, WeddingItemCategory } from "@/domain/weddingTypes";
import { addWeddingItem, updateWeddingItem } from "@/storage/weddingStorage";
import { CloseIcon } from "@/components/ui/Icons";

interface WeddingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: WeddingItem | null;
  onDataChange: () => void;
}

const KATEGORILER: { id: WeddingItemCategory; label: string; icon: string }[] = [
  { id: "mekan", label: "Mekan & Organizasyon", icon: "🏛️" },
  { id: "giyim", label: "Gelinlik & Damatlık", icon: "👗" },
  { id: "fotograf", label: "Fotoğraf & Video", icon: "📷" },
  { id: "davetiye", label: "Davetiye & Şeker", icon: "💌" },
  { id: "ceyiz", label: "Ev & Çeyiz", icon: "🛋️" },
  { id: "balayi", label: "Balayı & Seyahat", icon: "✈️" },
  { id: "diger", label: "Diğer Masraflar", icon: "✨" },
];

export function WeddingItemModal({
  isOpen,
  onClose,
  itemToEdit,
  onDataChange,
}: WeddingItemModalProps) {
  const [baslik, setBaslik] = useState("");
  const [kategori, setKategori] = useState<WeddingItemCategory>("mekan");
  const [tutarStr, setTutarStr] = useState("");
  const [sorumluKisi, setSorumluKisi] = useState<"mert" | "havsa" | "ortak">("ortak");
  const [notlar, setNotlar] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setBaslik(itemToEdit.baslik);
      setKategori(itemToEdit.kategori);
      setTutarStr(itemToEdit.tutar ? String(itemToEdit.tutar) : "");
      setSorumluKisi(itemToEdit.sorumluKisi || "ortak");
      setNotlar(itemToEdit.notlar || "");
    } else {
      setBaslik("");
      setKategori("mekan");
      setTutarStr("");
      setSorumluKisi("ortak");
      setNotlar("");
    }
    setHata(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baslik.trim()) {
      setHata("Lütfen bir başlık girin.");
      return;
    }
    const tutar = parseFloat(tutarStr.replace(/\./g, "").replace(",", "."));
    if (isNaN(tutar) || tutar < 0) {
      setHata("Lütfen geçerli bir tutar girin.");
      return;
    }

    if (itemToEdit) {
      updateWeddingItem({
        ...itemToEdit,
        baslik: baslik.trim(),
        kategori,
        tutar,
        sorumluKisi,
        notlar: notlar.trim() || undefined,
      });
    } else {
      addWeddingItem({
        baslik: baslik.trim(),
        kategori,
        tutar,
        tamamlandi: false,
        sorumluKisi,
        notlar: notlar.trim() || undefined,
      });
    }

    onDataChange();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-lg p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/70 border border-border-lavender flex items-center justify-center text-xl">
              💍
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {itemToEdit ? "Düğün Kalemini Düzenle" : "Yeni Düğün Kalemi Ekle"}
              </h3>
              <p className="text-xs text-muted">Düğün için yapılacak veya satın alınacak harcama kalemi</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          {hata && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 text-xs font-bold">
              ⚠️ {hata}
            </div>
          )}

          {/* Başlık */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Harcama / Görev Başlığı</label>
            <input
              type="text"
              placeholder="Örn: Gelinlik & Aksesuarlar, Düğün Salonu Kaparo"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              className="field text-xs font-semibold"
              autoFocus
              required
            />
          </div>

          {/* Kategori Seçici */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Kategori</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {KATEGORILER.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKategori(k.id)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    kategori === k.id
                      ? "border-primary bg-accent/60 text-primary"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>{k.icon}</span>
                  <span className="truncate">{k.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tutar & Sorumlu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tahmini / Net Fiyat (₺)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={tutarStr}
                  onChange={(e) => setTutarStr(e.target.value)}
                  className="field pr-10 font-bold text-base tabular-nums"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-xs">
                  ₺
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sorumlu / İlgilenen</label>
              <div className="grid grid-cols-3 gap-1 h-10">
                <button
                  type="button"
                  onClick={() => setSorumluKisi("ortak")}
                  className={`rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    sorumluKisi === "ortak"
                      ? "border-primary bg-accent/70 text-primary"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  Ortak
                </button>
                <button
                  type="button"
                  onClick={() => setSorumluKisi("mert")}
                  className={`rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    sorumluKisi === "mert"
                      ? "border-sky-500 bg-sky-500/15 text-sky-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  Mert
                </button>
                <button
                  type="button"
                  onClick={() => setSorumluKisi("havsa")}
                  className={`rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    sorumluKisi === "havsa"
                      ? "border-pink-500 bg-pink-500/15 text-pink-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  Havsa
                </button>
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Notlar & Açıklama (İsteğe Bağlı)</label>
            <input
              type="text"
              placeholder="Örn: 2 taksitle ödenecek, kaparo verildi vs."
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              className="field text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button px-4 py-2 text-xs"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="primary-button px-5 py-2 text-xs"
            >
              <span>{itemToEdit ? "💾" : "➕"}</span>
              <span>{itemToEdit ? "Güncelle" : "Kalemi Ekle"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
