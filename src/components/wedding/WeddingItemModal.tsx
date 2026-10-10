"use client";

import { useState, useEffect } from "react";
import { WeddingItem, WeddingItemCategory } from "@/domain/weddingTypes";
import { addWeddingItem, updateWeddingItem } from "@/storage/weddingStorage";

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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-surface border border-border/80 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl shadow-xs">
              💍
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {itemToEdit ? "Düğün Kalemini Düzenle" : "Yeni Düğün Kalemi Ekle"}
              </h3>
              <p className="text-xs text-muted">Düğün için yapılacak veya satın alınacak harcama kalemi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          {hata && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
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
              className="w-full h-11 px-3.5 rounded-2xl bg-surface-raised border border-border/80 text-xs text-foreground font-semibold focus:outline-hidden focus:border-rose-500 transition"
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
                      ? "border-rose-500 bg-rose-500/15 text-rose-500 dark:text-rose-400 shadow-xs"
                      : "border-border/70 bg-surface-raised/50 text-muted hover:text-foreground hover:bg-surface-raised"
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
                  className="w-full h-11 pl-3.5 pr-10 rounded-2xl bg-surface-raised border border-border/80 text-foreground font-bold text-base focus:outline-hidden focus:border-rose-500 transition"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-xs">
                  ₺
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sorumlu / İlgilenen</label>
              <div className="grid grid-cols-3 gap-1 h-11">
                <button
                  type="button"
                  onClick={() => setSorumluKisi("ortak")}
                  className={`rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    sorumluKisi === "ortak"
                      ? "border-purple-500 bg-purple-500/15 text-purple-400"
                      : "border-border/70 bg-surface-raised/50 text-muted hover:text-foreground"
                  }`}
                >
                  Ortak
                </button>
                <button
                  type="button"
                  onClick={() => setSorumluKisi("mert")}
                  className={`rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    sorumluKisi === "mert"
                      ? "border-sky-500 bg-sky-500/15 text-sky-400"
                      : "border-border/70 bg-surface-raised/50 text-muted hover:text-foreground"
                  }`}
                >
                  Mert
                </button>
                <button
                  type="button"
                  onClick={() => setSorumluKisi("havsa")}
                  className={`rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    sorumluKisi === "havsa"
                      ? "border-pink-500 bg-pink-500/15 text-pink-400"
                      : "border-border/70 bg-surface-raised/50 text-muted hover:text-foreground"
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
              className="w-full h-10 px-3.5 rounded-xl bg-surface-raised border border-border/80 text-xs text-foreground focus:outline-hidden focus:border-rose-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button h-10 px-4 text-xs font-bold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="primary-button h-10 px-5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
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
