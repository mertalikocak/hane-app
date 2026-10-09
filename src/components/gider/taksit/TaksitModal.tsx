"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/Icons";
import type {
  TaksitKalemi,
  TaksitKarti,
  TaksitSahibi,
  TaksitKategori,
} from "@/domain/taksitTypes";

interface TaksitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taksit: Omit<TaksitKalemi, "id" | "createdAt">) => void;
  kartlar: TaksitKarti[];
  editingTaksit?: TaksitKalemi | null;
  defaultKartId?: string;
}

const KATEGORILER: { id: TaksitKategori; label: string; icon: string }[] = [
  { id: "elektronik", label: "Elektronik", icon: "📱" },
  { id: "ev_yasam", label: "Ev & Yaşam", icon: "🏠" },
  { id: "giyim", label: "Giyim & Moda", icon: "👕" },
  { id: "araba", label: "Araç & Bakım", icon: "🚗" },
  { id: "saglik", label: "Sağlık & Bakım", icon: "🏥" },
  { id: "tatil", label: "Tatil & Seyahat", icon: "✈️" },
  { id: "diger", label: "Diğer", icon: "📦" },
];

export function TaksitModal({
  isOpen,
  onClose,
  onSave,
  kartlar,
  editingTaksit,
  defaultKartId,
}: TaksitModalProps) {
  const [mounted, setMounted] = useState(false);
  const [kartId, setKartId] = useState("");
  const [urunAdi, setUrunAdi] = useState("");
  const [toplamTutar, setToplamTutar] = useState("");
  const [toplamTaksit, setToplamTaksit] = useState("6");
  const [odenenTaksit, setOdenenTaksit] = useState("0");
  const [aylikTutar, setAylikTutar] = useState("");
  const [sahip, setSahip] = useState<TaksitSahibi>("mert");
  const [kategori, setKategori] = useState<TaksitKategori>("elektronik");
  const [notlar, setNotlar] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editingTaksit) {
        setKartId(editingTaksit.kartId);
        setUrunAdi(editingTaksit.urunAdi);
        setToplamTutar(String(editingTaksit.toplamTutar));
        setToplamTaksit(String(editingTaksit.toplamTaksit));
        setOdenenTaksit(String(editingTaksit.odenenTaksit));
        setAylikTutar(String(editingTaksit.aylikTutar));
        setSahip(editingTaksit.sahip);
        setKategori(editingTaksit.kategori || "elektronik");
        setNotlar(editingTaksit.notlar || "");
      } else {
        const initialKart = defaultKartId || (kartlar.length > 0 ? kartlar[0].id : "");
        setKartId(initialKart);
        setUrunAdi("");
        setToplamTutar("");
        setToplamTaksit("6");
        setOdenenTaksit("0");
        setAylikTutar("");
        setSahip("mert");
        setKategori("elektronik");
        setNotlar("");
      }
    }
  }, [isOpen, editingTaksit, defaultKartId, kartlar]);

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

  // Otomatik hesaplama: Toplam tutar değiştikçe aylık tutarı güncelle
  const handleToplamTutarChange = (val: string) => {
    setToplamTutar(val);
    const num = parseFloat(val.replace(",", "."));
    const count = parseInt(toplamTaksit, 10);
    if (!isNaN(num) && count > 0) {
      setAylikTutar((num / count).toFixed(2));
    }
  };

  const handleToplamTaksitChange = (val: string) => {
    setToplamTaksit(val);
    const count = parseInt(val, 10);
    const total = parseFloat(toplamTutar.replace(",", "."));
    if (!isNaN(total) && count > 0) {
      setAylikTutar((total / count).toFixed(2));
    }
  };

  const handleAylikTutarChange = (val: string) => {
    setAylikTutar(val);
    const monthly = parseFloat(val.replace(",", "."));
    const count = parseInt(toplamTaksit, 10);
    if (!isNaN(monthly) && count > 0) {
      setToplamTutar((monthly * count).toFixed(2));
    }
  };

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urunAdi.trim() || !kartId) return;

    const total = parseFloat(toplamTutar.replace(",", ".")) || 0;
    const count = Math.max(1, parseInt(toplamTaksit, 10) || 1);
    const paid = Math.min(count, Math.max(0, parseInt(odenenTaksit, 10) || 0));
    const monthly = parseFloat(aylikTutar.replace(",", ".")) || (count > 0 ? total / count : total);

    onSave({
      kartId,
      urunAdi: urunAdi.trim(),
      toplamTutar: total,
      toplamTaksit: count,
      odenenTaksit: paid,
      aylikTutar: monthly,
      sahip,
      kategori,
      notlar: notlar.trim() || undefined,
    });

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/70 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-bold text-lg shadow-sm">
              🏷️
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {editingTaksit ? "Taksiti Düzenle" : "Yeni Taksit Ekle"}
              </h2>
              <p className="text-xs text-muted">
                Ürün, tutar ve taksit detaylarını girin
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Kart Seçimi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">
              Hangi Karttan Çekildi? *
            </label>
            {kartlar.length === 0 ? (
              <div className="p-3 rounded-2xl border border-dashed border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs">
                Önce bir kredi kartı tanımlamanız gerekiyor.
              </div>
            ) : (
              <select
                required
                value={kartId}
                onChange={(e) => setKartId(e.target.value)}
                className="field font-medium"
              >
                {kartlar.map((k) => (
                  <option key={k.id} value={k.id}>
                    💳 {k.ad} ({k.kartSahibi.toUpperCase()}) — Ekstre: {k.ekstreGunu}'i
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ürün Adı */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">
              Ürün / Harcama Adı *
            </label>
            <input
              type="text"
              required
              value={urunAdi}
              onChange={(e) => setUrunAdi(e.target.value)}
              placeholder="örn: iPhone 16 Pro, Dyson Süpürge, Kış Lastiği..."
              className="field"
            />
          </div>

          {/* Tutar & Taksit Sayısı */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Toplam Tutar (₺) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={toplamTutar}
                onChange={(e) => handleToplamTutarChange(e.target.value)}
                placeholder="örn: 36000"
                className="field font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Toplam Taksit *
              </label>
              <input
                type="number"
                min={1}
                max={48}
                required
                value={toplamTaksit}
                onChange={(e) => handleToplamTaksitChange(e.target.value)}
                className="field font-bold text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Aylık Taksit (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={aylikTutar}
                onChange={(e) => handleAylikTutarChange(e.target.value)}
                placeholder="örn: 6000"
                className="field font-bold text-primary"
              />
            </div>
          </div>

          {/* Mevcut Durum: Ödenen Taksit Sayısı */}
          <div className="p-3.5 rounded-2xl bg-surface-raised/70 border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Şu Ana Kadar Ödenen Taksit Sayısı
              </label>
              <span className="text-xs font-bold text-primary">
                {odenenTaksit} / {toplamTaksit} ödendi
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={parseInt(toplamTaksit, 10) || 1}
                value={odenenTaksit}
                onChange={(e) => setOdenenTaksit(e.target.value)}
                className="flex-1 accent-primary cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={parseInt(toplamTaksit, 10) || 1}
                value={odenenTaksit}
                onChange={(e) => setOdenenTaksit(e.target.value)}
                className="w-16 field text-center font-bold"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-border/50">
              <span>
                Kalan: {Math.max(0, (parseInt(toplamTaksit, 10) || 0) - (parseInt(odenenTaksit, 10) || 0))} taksit
              </span>
              <span>
                Kalan Borç:{" "}
                {(
                  Math.max(0, (parseInt(toplamTaksit, 10) || 0) - (parseInt(odenenTaksit, 10) || 0)) *
                  (parseFloat(aylikTutar.replace(",", ".")) || 0)
                ).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </span>
            </div>
          </div>

          {/* Taksit Kime Ait? */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">
              Taksit Kime Ait?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSahip("mert")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  sahip === "mert"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                }`}
              >
                👤 Mert
              </button>
              <button
                type="button"
                onClick={() => setSahip("havsa")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  sahip === "havsa"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                }`}
              >
                👤 Havsa
              </button>
              <button
                type="button"
                onClick={() => setSahip("ortak")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  sahip === "ortak"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                }`}
              >
                👥 Ortak
              </button>
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">
              Kategori
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as TaksitKategori)}
              className="field font-medium"
            >
              {KATEGORILER.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notlar */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">
              Notlar (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder="örn: Hepsiburada 6 taksit peşin fiyatına"
              className="field"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-border/70 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button flex-1"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!urunAdi.trim() || !kartId || !toplamTutar}
              className="primary-button flex-1"
            >
              {editingTaksit ? "Kaydet" : "Taksiti Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
