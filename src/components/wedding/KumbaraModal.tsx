"use client";

import { useState } from "react";
import { WeddingPiggyContribution, WeddingKisi } from "@/domain/weddingTypes";
import { addPiggyContribution, deletePiggyContribution } from "@/storage/weddingStorage";

interface KumbaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  katkilar: WeddingPiggyContribution[];
  onDataChange: () => void;
  defaultKisi?: WeddingKisi;
}

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);

export function KumbaraModal({
  isOpen,
  onClose,
  katkilar,
  onDataChange,
  defaultKisi = "mert",
}: KumbaraModalProps) {
  const [activeTab, setActiveTab] = useState<"ekle" | "gecmis">("ekle");
  const [ekleyenKisi, setEkleyenKisi] = useState<WeddingKisi>(defaultKisi);
  const [tutarStr, setTutarStr] = useState<string>("");
  const [aciklama, setAciklama] = useState<string>("");
  const [tarih, setTarih] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [hata, setHata] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKaydet = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = parseFloat(tutarStr.replace(/\./g, "").replace(",", "."));
    if (isNaN(tutar) || tutar <= 0) {
      setHata("Lütfen geçerli bir tutar girin.");
      return;
    }

    addPiggyContribution({
      ekleyenKisi,
      ekleyenKisiAd: ekleyenKisi === "mert" ? "Mert" : ekleyenKisi === "havsa" ? "Havsa" : "Aile / Hediye",
      tutar,
      tarih: tarih || new Date().toISOString().split("T")[0],
      aciklama: aciklama.trim() || undefined,
    });

    setTutarStr("");
    setAciklama("");
    setHata(null);
    onDataChange();
    onClose();
  };

  const handleSil = (id: string) => {
    if (confirm("Bu kumbara girişini silmek istediğinize emin misiniz?")) {
      deletePiggyContribution(id);
      onDataChange();
    }
  };

  const hazirAciklamalar = ["Maaş birikimi", "Altın bozdurma", "Aile desteği", "Düğün takısı", "Ek gelir"];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-surface border border-border/80 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shadow-xs">
              🪙
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Düğün Kumbarası</h3>
              <p className="text-xs text-muted">Ortak birikim ekleyin ve kumbara geçmişini inceleyin</p>
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

        {/* Tab Selector */}
        <div className="flex items-center p-1 rounded-2xl bg-surface-raised border border-border/70 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ekle")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "ekle"
                ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>➕</span> Para Ekle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gecmis")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "gecmis"
                ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>📜</span> Katkı Geçmişi ({katkilar.length})
          </button>
        </div>

        {activeTab === "ekle" ? (
          <form onSubmit={handleKaydet} className="space-y-4 overflow-y-auto pr-1">
            {hata && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                ⚠️ {hata}
              </div>
            )}

            {/* Parayı Kim Ekliyor? */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Parayı Kim Ekliyor?</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("mert")}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "mert"
                      ? "border-sky-500 bg-sky-500/15 text-sky-400 shadow-xs"
                      : "border-border/70 bg-surface-raised/50 text-muted hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <span className="text-base">👤</span>
                  <span>Mert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("havsa")}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "havsa"
                      ? "border-pink-500 bg-pink-500/15 text-pink-400 shadow-xs"
                      : "border-border/70 bg-surface-raised/50 text-muted hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <span className="text-base">👤</span>
                  <span>Havsa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("diger")}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "diger"
                      ? "border-amber-500 bg-amber-500/15 text-amber-400 shadow-xs"
                      : "border-border/70 bg-surface-raised/50 text-muted hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <span className="text-base">🎁</span>
                  <span>Aile / Diğer</span>
                </button>
              </div>
            </div>

            {/* Tutar */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Eklenecek Tutar (₺)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Örn: 15000"
                  value={tutarStr}
                  onChange={(e) => setTutarStr(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-2xl bg-surface-raised border border-border/80 text-foreground font-black text-lg focus:outline-hidden focus:border-amber-500 transition"
                  autoFocus
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                  ₺
                </span>
              </div>
            </div>

            {/* Açıklama / Kaynak */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Açıklama / Kaynak (İsteğe Bağlı)</label>
              <input
                type="text"
                placeholder="Örn: Kasım maaş birikimi"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-raised border border-border/80 text-xs text-foreground focus:outline-hidden focus:border-amber-500 transition"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hazirAciklamalar.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setAciklama(h)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-surface-raised border border-border/60 text-muted hover:text-foreground hover:border-amber-500/40 transition cursor-pointer"
                  >
                    + {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarih */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tarih</label>
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border/80 text-xs text-foreground focus:outline-hidden focus:border-amber-500 transition"
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
                className="primary-button h-10 px-5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>🪙</span> Kumbaraya Ekle
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {katkilar.length === 0 ? (
              <div className="py-12 text-center text-muted text-xs">
                Kumbaraya henüz para eklenmedi.
              </div>
            ) : (
              katkilar.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-surface-raised border border-border/60 hover:border-amber-500/30 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold bg-surface border border-border/80">
                      {k.ekleyenKisi === "mert" ? "👤" : k.ekleyenKisi === "havsa" ? "👩" : "🎁"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground">
                          {k.ekleyenKisi === "mert" ? "Mert" : k.ekleyenKisi === "havsa" ? "Havsa" : "Aile / Diğer"}
                        </span>
                        <span className="text-[10px] text-muted">{k.tarih}</span>
                      </div>
                      {k.aciklama && (
                        <p className="text-[11px] text-muted">{k.aciklama}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-xs text-amber-500 dark:text-amber-400">
                      +{para(k.tutar)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSil(k.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 opacity-70 group-hover:opacity-100 transition cursor-pointer text-xs"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
