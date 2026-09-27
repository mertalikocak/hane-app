"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  tumHaneVerileriniTopla,
  tumHaneYedekDosyasiIndir,
  yedekDosyasiniDogrula,
  tumHaneVerileriniIceAktar,
  HaneModulOzet,
  IceAktarmaOnizleme,
} from "@/storage/tumHaneYedekDeposu";

interface YedekModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YedekModal({ isOpen, onClose }: YedekModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [currentSummary, setCurrentSummary] = useState<HaneModulOzet | null>(null);
  
  // Import State
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<IceAktarmaOnizleme | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const data = tumHaneVerileriniTopla();
      setCurrentSummary(data.ozet);
      setImportText("");
      setImportPreview(null);
      setImportStatus(null);
      setIsCopied(false);
    }
  }, [isOpen]);

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

  const handleDownload = () => {
    tumHaneYedekDosyasiIndir();
  };

  const handleShareOrCopy = async () => {
    const data = tumHaneVerileriniTopla();
    const jsonStr = JSON.stringify(data, null, 2);

    if (navigator.share) {
      try {
        const blob = new Blob([jsonStr], { type: "application/json" });
        const file = new File([blob], `hane-yedek-${new Date().toISOString().slice(0, 10)}.json`, {
          type: "application/json",
        });
        await navigator.share({
          title: "Hane App Tam Yedek",
          text: "Hane App yedek verisi",
          files: [file],
        });
        return;
      } catch {
        // Fallback to clipboard if share cancelled/failed
      }
    }

    try {
      await navigator.clipboard.writeText(jsonStr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      alert("Panoya kopyalanamadı.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      const preview = yedekDosyasiniDogrula(content);
      setImportPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setImportPreview(null);
      return;
    }
    const preview = yedekDosyasiniDogrula(text);
    setImportPreview(preview);
  };

  const handleConfirmImport = () => {
    if (!importPreview?.gecerli || !importPreview.hamVeriler) return;

    const res = tumHaneVerileriniIceAktar(importPreview.hamVeriler);
    if (res.basarili) {
      setImportStatus("success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setImportStatus("error: " + (res.hata || "Bilinmeyen hata"));
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/70 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl shadow-sm">
              🔄
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground">
                Veri Aktarımı & Yedekleme
              </h2>
              <p className="text-xs text-muted">
                Tüm modülleri masaüstü ve mobil arasında senkronize edin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface-raised text-muted hover:text-foreground transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 border-b border-border/60 bg-surface-raised/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "export"
                ? "bg-surface text-foreground shadow-xs border border-border"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            📤 Yedeği İndir (Dışa Aktar)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "import"
                ? "bg-surface text-foreground shadow-xs border border-border"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            📥 Yedeği Yükle (İçe Aktar)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === "export" ? (
            /* EXPORT TAB */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  Mevcut Cihazdaki Tüm Verileriniz
                </h3>
                <p className="text-xs text-muted">
                  Aşağıdaki tüm modül kayıtları tek bir güvenli JSON yedek dosyasına paketlenir:
                </p>
              </div>

              {/* Module badges */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-border/70 bg-surface-raised/60 p-3 text-center">
                  <span className="text-lg block">💰</span>
                  <span className="text-xs font-bold text-foreground block mt-1">Ev Giderleri</span>
                  <span className="text-[11px] text-muted">
                    {currentSummary?.giderAySayisi || 0} Ay Kaydı
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface-raised/60 p-3 text-center">
                  <span className="text-lg block">🚗</span>
                  <span className="text-xs font-bold text-foreground block mt-1">Hane Car</span>
                  <span className="text-[11px] text-muted">
                    {currentSummary?.carDoGiderSayisi || 0} Masraf
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface-raised/60 p-3 text-center">
                  <span className="text-lg block">🍽️</span>
                  <span className="text-xs font-bold text-foreground block mt-1">Hane Dinner</span>
                  <span className="text-[11px] text-muted">
                    {currentSummary?.dinnerYemekSayisi || 0} Yemek • {currentSummary?.dinnerPlanSayisi || 0} Plan
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface-raised/60 p-3 text-center">
                  <span className="text-lg block">📅</span>
                  <span className="text-xs font-bold text-foreground block mt-1">Hane Calendar</span>
                  <span className="text-[11px] text-muted">
                    {currentSummary?.calendarEtkinlikSayisi || 0} Etkinlik
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface-raised/60 p-3 text-center">
                  <span className="text-lg block">🎁</span>
                  <span className="text-xs font-bold text-foreground block mt-1">Hane Wish List</span>
                  <span className="text-[11px] text-muted">
                    {currentSummary?.wishlistSayisi || 0} İstek
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface-raised/60 p-3 text-center col-span-2">
                  <span className="text-lg block">📐</span>
                  <span className="text-xs font-bold text-foreground block mt-1">Hane Fit</span>
                  <span className="text-[11px] text-muted">
                    {currentSummary?.fitProfilSayisi || 0} Profil • {currentSummary?.fitOlcumSayisi || 0} Ölçüm
                  </span>
                </div>
              </div>

              {/* Export action buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-98 transition cursor-pointer"
                >
                  <span>💾</span>
                  <span>Tüm Verileri İndir (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareOrCopy}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised px-5 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface transition cursor-pointer"
                >
                  <span>📱</span>
                  <span>{isCopied ? "✓ Panoya Kopyalandı!" : "Mobilde Paylaş / Panoya Kopyala"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* IMPORT TAB */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  Yedek Dosyasını Yükleyin
                </h3>
                <p className="text-xs text-muted">
                  İndirdiğiniz <code>.json</code> dosyasını seçin veya kopyaladığınız metni aşağıya yapıştırın.
                </p>
              </div>

              {/* File upload zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/60 bg-surface-raised/40 p-6 text-center transition cursor-pointer group"
              >
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-surface border border-border/80 text-2xl group-hover:scale-110 transition-transform">
                  📁
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground block mt-2">
                  Dosya Seç (.json)
                </span>
                <span className="text-[11px] text-muted block mt-0.5">
                  veya buraya tıklayarak yedek dosyanızı seçin
                </span>
              </button>

              {/* Or paste JSON text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  veya JSON Metnini Buraya Yapıştırın:
                </label>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder='{"uygulama": "hane-app", "veriler": { ... }}'
                  className="field text-xs font-mono"
                />
              </div>

              {/* Import Preview Card */}
              {importPreview && (
                <div
                  className={`rounded-2xl p-4 border transition-all ${
                    importPreview.gecerli
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
                  }`}
                >
                  {importPreview.gecerli && importPreview.ozet ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span>✓ Geçerli Yedek Dosyası Algılandı</span>
                      </div>
                      <div className="text-[11px] space-y-0.5 opacity-90">
                        <p>• 💰 <strong>{importPreview.ozet.giderAySayisi}</strong> ay ev gideri</p>
                        <p>• 🚗 <strong>{importPreview.ozet.carDoGiderSayisi}</strong> araç masrafı</p>
                        <p>• 🍽️ <strong>{importPreview.ozet.dinnerYemekSayisi}</strong> yemek ve <strong>{importPreview.ozet.dinnerPlanSayisi}</strong> plan</p>
                        <p>• 📅 <strong>{importPreview.ozet.calendarEtkinlikSayisi || 0}</strong> takvim etkinliği</p>
                        <p>• 🎁 <strong>{importPreview.ozet.wishlistSayisi || 0}</strong> istek / dilek kaydı</p>
                        <p>• 📐 <strong>{importPreview.ozet.fitProfilSayisi}</strong> fit profili ve <strong>{importPreview.ozet.fitOlcumSayisi}</strong> ölçüm</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-rose-500">
                      ⚠️ {importPreview.hata}
                    </div>
                  )}
                </div>
              )}

              {/* Success / Error notification */}
              {importStatus === "success" && (
                <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  ✓ Tüm veriler başarıyla yüklendi! Sayfa yenileniyor...
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                disabled={!importPreview?.gecerli || importStatus === "success"}
                onClick={handleConfirmImport}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-98 transition cursor-pointer disabled:opacity-50"
              >
                <span>📥</span>
                <span>Verileri İçe Aktar & Yükle</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
