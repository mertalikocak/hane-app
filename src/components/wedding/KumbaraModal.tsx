"use client";

import { useState } from "react";
import { WeddingPiggyContribution, WeddingKisi } from "@/domain/weddingTypes";
import { addPiggyContribution, deletePiggyContribution } from "@/storage/weddingStorage";
import { CloseIcon, TrashIcon } from "@/components/ui/Icons";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleConfirmSil = (id: string) => {
    deletePiggyContribution(id);
    setConfirmDeleteId(null);
    onDataChange();
  };

  const hazirAciklamalar = ["Maaş birikimi", "Altın bozdurma", "Aile desteği", "Düğün takısı", "Ek gelir"];

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
              🪙
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Düğün Kumbarası</h3>
              <p className="text-xs text-muted">Ortak birikim ekleyin ve kumbara geçmişini inceleyin</p>
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

        {/* Tab Selector */}
        <div className="flex items-center p-1 rounded-xl bg-surface-raised border border-border shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ekle")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "ekle"
                ? "bg-surface text-primary border border-border shadow-2xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>➕</span> Para Ekle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gecmis")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "gecmis"
                ? "bg-surface text-primary border border-border shadow-2xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>📜</span> Katkı Geçmişi ({katkilar.length})
          </button>
        </div>

        {activeTab === "ekle" ? (
          <form onSubmit={handleKaydet} className="space-y-4 overflow-y-auto pr-1">
            {hata && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 text-xs font-bold">
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
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "mert"
                      ? "border-sky-500 bg-sky-500/15 text-sky-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base">👤</span>
                  <span>Mert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("havsa")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "havsa"
                      ? "border-pink-500 bg-pink-500/15 text-pink-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base">👤</span>
                  <span>Havsa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("diger")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "diger"
                      ? "border-primary bg-accent/70 text-primary"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
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
                  className="field pr-12 font-bold text-lg tabular-nums"
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
                className="field text-xs"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hazirAciklamalar.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setAciklama(h)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-surface-raised border border-border text-muted hover:text-foreground hover:border-primary/40 transition cursor-pointer"
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
                className="field text-xs tabular-nums"
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
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-surface border border-border">
                      {k.ekleyenKisi === "mert" ? "👤" : k.ekleyenKisi === "havsa" ? "👩" : "🎁"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {k.ekleyenKisi === "mert" ? "Mert" : k.ekleyenKisi === "havsa" ? "Havsa" : "Aile / Diğer"}
                        </span>
                        <span className="text-[10px] text-muted tabular-nums">{k.tarih}</span>
                      </div>
                      {k.aciklama && (
                        <p className="text-[11px] text-muted">{k.aciklama}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-emerald-700 tabular-nums">
                      +{para(k.tutar)}
                    </span>
                    {confirmDeleteId === k.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmSil(k.id)}
                          className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-2 py-0.5 text-[10px] h-6 min-h-0"
                        >
                          Sil
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="secondary-button px-2 py-0.5 text-[10px] h-6 min-h-0"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(k.id)}
                        className="icon-button h-7 w-7 text-muted hover:text-rose-600"
                        title="Sil"
                      >
                        <TrashIcon size={13} />
                      </button>
                    )}
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
