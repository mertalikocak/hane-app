"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/Icons";
import type { TaksitKarti, TaksitSahibi, KartRengi } from "@/domain/taksitTypes";

interface KartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kart: Omit<TaksitKarti, "id" | "createdAt">) => void;
  editingKart?: TaksitKarti | null;
}

const RENKLER: { id: KartRengi; label: string; bg: string }[] = [
  { id: "emerald", label: "Zümrüt Yeşil", bg: "bg-emerald-600" },
  { id: "blue", label: "Klasik Mavi", bg: "bg-blue-600" },
  { id: "purple", label: "Asil Mor", bg: "bg-purple-600" },
  { id: "amber", label: "Altın Sarısı", bg: "bg-amber-600" },
  { id: "rose", label: "Gül Kırmızı", bg: "bg-rose-600" },
  { id: "slate", label: "Gece Grisi", bg: "bg-slate-700" },
  { id: "cyan", label: "Turkuaz", bg: "bg-cyan-600" },
];

export function KartModal({
  isOpen,
  onClose,
  onSave,
  editingKart,
}: KartModalProps) {
  const [mounted, setMounted] = useState(false);
  const [ad, setAd] = useState("");
  const [banka, setBanka] = useState("");
  const [ekstreGunu, setEkstreGunu] = useState("15");
  const [sonOdemeGunu, setSonOdemeGunu] = useState("25");
  const [kartSahibi, setKartSahibi] = useState<TaksitSahibi>("mert");
  const [renk, setRenk] = useState<KartRengi>("emerald");
  const [sonHane, setSonHane] = useState("");
  const [kartLimiti, setKartLimiti] = useState("");
  const [aktif, setAktif] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editingKart) {
        setAd(editingKart.ad);
        setBanka(editingKart.banka || "");
        setEkstreGunu(String(editingKart.ekstreGunu));
        setSonOdemeGunu(editingKart.sonOdemeGunu ? String(editingKart.sonOdemeGunu) : "");
        setKartSahibi(editingKart.kartSahibi);
        setRenk(editingKart.renk || "emerald");
        setSonHane(editingKart.sonHane || "");
        setKartLimiti(editingKart.kartLimiti ? String(editingKart.kartLimiti) : "");
        setAktif(editingKart.aktif !== false);
      } else {
        setAd("");
        setBanka("");
        setEkstreGunu("15");
        setSonOdemeGunu("25");
        setKartSahibi("mert");
        setRenk("emerald");
        setSonHane("");
        setKartLimiti("");
        setAktif(true);
      }
    }
  }, [isOpen, editingKart]);

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

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim()) return;

    const ekstreNum = Math.min(31, Math.max(1, parseInt(ekstreGunu, 10) || 1));
    const sonNum = sonOdemeGunu ? Math.min(31, Math.max(1, parseInt(sonOdemeGunu, 10) || 1)) : undefined;

    const limitNum = kartLimiti ? parseFloat(kartLimiti) : undefined;

    onSave({
      ad: ad.trim(),
      banka: banka.trim() || undefined,
      ekstreGunu: ekstreNum,
      sonOdemeGunu: sonNum,
      kartSahibi,
      renk,
      sonHane: sonHane.trim() || undefined,
      kartLimiti: limitNum && limitNum > 0 ? limitNum : undefined,
      aktif,
    });

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/70 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-bold text-lg shadow-sm">
              💳
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {editingKart ? "Kredi Kartını Düzenle" : "Yeni Kredi Kartı Tanımla"}
              </h2>
              <p className="text-xs text-muted">
                Taksitlerin son ödeme günlerini ve doluluk limitini hesaplamak için kullanılır
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
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">
              Kart Adı *
            </label>
            <input
              type="text"
              required
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="örn: Garanti Bonus, Yapı Kredi World..."
              className="field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Banka (İsteğe bağlı)
              </label>
              <input
                type="text"
                value={banka}
                onChange={(e) => setBanka(e.target.value)}
                placeholder="örn: Garanti BBVA"
                className="field"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Son 4 Hane (İsteğe bağlı)
              </label>
              <input
                type="text"
                maxLength={4}
                value={sonHane}
                onChange={(e) => setSonHane(e.target.value)}
                placeholder="örn: 4129"
                className="field"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Kart Limiti (Opsiyonel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={kartLimiti}
                  onChange={(e) => setKartLimiti(e.target.value)}
                  placeholder="örn: 75000"
                  className="field pr-7 font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                  ₺
                </span>
              </div>
            </div>
          </div>

          {/* Tarihler: Ekstre Günü & Son Ödeme Günü */}
          <div className="p-3.5 rounded-2xl bg-surface-raised/70 border border-border/70 space-y-3">
            <span className="text-xs font-bold text-foreground block flex items-center gap-1.5">
              <span>📅</span> Ekstre & Son Ödeme Takvimi
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground block">
                  Ekstre Kesim Günü *
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">Her ayın</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={ekstreGunu}
                    onChange={(e) => setEkstreGunu(e.target.value)}
                    className="field text-center font-bold"
                  />
                  <span className="text-xs text-muted">'i</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground block">
                  Son Ödeme Günü
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">Her ayın</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={sonOdemeGunu}
                    onChange={(e) => setSonOdemeGunu(e.target.value)}
                    placeholder="25"
                    className="field text-center font-bold"
                  />
                  <span className="text-xs text-muted">'i</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted">
              * Son ödeme günü boş bırakılırsa otomatik olarak hesap kesim tarihinden 10 gün sonrası baz alınır.
            </p>
          </div>

          {/* Kart Sahibi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">
              Kart Kime Ait?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setKartSahibi("mert")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  kartSahibi === "mert"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                }`}
              >
                👤 Mert
              </button>
              <button
                type="button"
                onClick={() => setKartSahibi("havsa")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  kartSahibi === "havsa"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                }`}
              >
                👤 Havsa
              </button>
              <button
                type="button"
                onClick={() => setKartSahibi("ortak")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  kartSahibi === "ortak"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                }`}
              >
                👥 Ortak
              </button>
            </div>
          </div>

          {/* Kart Renk Teması */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Kart Rengi
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {RENKLER.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRenk(r.id)}
                  className={`h-7 w-7 rounded-xl ${r.bg} transition-all cursor-pointer flex items-center justify-center ${
                    renk === r.id ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  title={r.label}
                >
                  {renk === r.id && <span className="text-white text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Aktiflik Durumu */}
          <div className="pt-1">
            <label className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface-raised border border-border/70 cursor-pointer select-none hover:bg-border/20 transition">
              <input
                type="checkbox"
                checked={aktif}
                onChange={(e) => setAktif(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-foreground block">
                  Aktif Kart
                </span>
                <span className="text-[11px] text-muted block">
                  İşaret kaldırılırsa bu karta ait taksitler genel hesaplamalara dahil edilmez.
                </span>
              </div>
            </label>
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
              className="primary-button flex-1"
            >
              {editingKart ? "Kaydet" : "Kartı Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
