"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { para, tutarMetniInputIcin, KULLANICI_ETIKET, ODEYEN_ETIKET } from "./constants";
import type {
  KrediKartiEkstresi,
  KullaniciId,
  AyHaneGiderVerisi,
} from "@/domain/haneGiderTypes";
import type { GiderV2Calculations } from "./types";

// ------------------------------------------------------------------
// 1. KART / HARCAMA EKLE & DÜZENLE MODALI
// ------------------------------------------------------------------

interface KartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kayit: {
    id?: string;
    ad: string;
    toplamEkstre: number;
    odenenKisi: "mert" | "havsa" | "ortak";
    kimeAit?: "ortak" | "mert" | "havsa";
    tumGiderToplamlarindaHaric?: boolean;
    kayitTipi?: "kart" | "harcama";
  }) => void;
  initialData?: KrediKartiEkstresi | null;
}

export function KartEkleDuzenleModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: KartModalProps) {
  const [kayitTipi, setKayitTipi] = useState<"kart" | "harcama">("kart");
  const [kimeAit, setKimeAit] = useState<"ortak" | "mert" | "havsa">("ortak");
  const [ad, setAd] = useState("");
  const [toplamStr, setToplamStr] = useState("");
  const [odenenKisi, setOdenenKisi] = useState<"mert" | "havsa" | "ortak">("mert");
  const [tumGiderToplamlarindaHaric, setTumGiderToplamlarindaHaric] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAd(initialData.ad);
      setToplamStr(tutarMetniInputIcin(initialData.toplamEkstre));
      setOdenenKisi(
        initialData.odenenKisi ??
          (initialData.ad.toLowerCase().includes("havsa") ? "havsa" : "mert")
      );
      setKimeAit(initialData.kimeAit ?? "ortak");
      setTumGiderToplamlarindaHaric(Boolean(initialData.tumGiderToplamlarindaHaric));
      setKayitTipi(initialData.kayitTipi ?? (initialData.bireyselKalemler.length > 0 ? "kart" : "kart"));
    } else {
      setAd("");
      setToplamStr("");
      setOdenenKisi("mert");
      setKimeAit("ortak");
      setTumGiderToplamlarindaHaric(false);
      setKayitTipi("kart");
    }
  }, [initialData, isOpen]);

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

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = Number(toplamStr.replace(",", "."));
    if (!ad.trim() || !Number.isFinite(tutar) || tutar < 0) return;

    onSave({
      id: initialData?.id,
      ad: ad.trim(),
      toplamEkstre: tutar,
      odenenKisi,
      kimeAit,
      tumGiderToplamlarindaHaric,
      kayitTipi,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-3xl bg-surface border border-border shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{kayitTipi === "kart" ? "💳" : "🧾"}</span>
            <h3 className="text-base font-black text-foreground">
              {initialData
                ? kayitTipi === "kart"
                  ? "Kartı Düzenle"
                  : "Harcamayı Düzenle"
                : "Yeni Kart veya Harcama Ekle"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Kayıt Türü: Kart mı, Harcama mı? */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1.5">
              Kayıt Türü Seçin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKayitTipi("kart")}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer ${
                  kayitTipi === "kart"
                    ? "bg-primary/15 text-primary border-primary shadow-xs ring-1 ring-primary/30"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
              >
                <span className="text-xl">💳</span>
                <span className="font-black text-foreground">Kredi Kartı</span>
                <span className="text-[10px] text-muted">Bireysel kalem ayrıştırılabilir</span>
              </button>

              <button
                type="button"
                onClick={() => setKayitTipi("harcama")}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center text-center gap-1 cursor-pointer ${
                  kayitTipi === "harcama"
                    ? "bg-purple-500/15 text-purple-400 border-purple-500 shadow-xs ring-1 ring-purple-500/30"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
              >
                <span className="text-xl">🧾</span>
                <span className="font-black text-foreground">Tek Seferlik Harcama</span>
                <span className="text-[10px] text-muted">Kira, fatura, alışveriş (tek kalem)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1">
              {kayitTipi === "kart" ? "Kart Adı" : "Harcama / Fatura Adı"}
            </label>
            <input
              type="text"
              required
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder={
                kayitTipi === "kart"
                  ? "Örn: Garanti Bonus, Yapı Kredi World, Enpara"
                  : "Örn: Ev Kirası, Apartman Aidatı, Su Faturası"
              }
              className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border text-xs font-bold text-foreground focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1">
              {kayitTipi === "kart" ? "Toplam Ekstre Tutarı (₺)" : "Toplam Harcama Tutarı (₺)"}
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={toplamStr}
              onChange={(e) => setToplamStr(e.target.value)}
              placeholder="0,00"
              className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border text-sm font-black text-foreground font-mono focus:border-primary transition"
            />
          </div>

          {/* Harcama / Kart Kapsamı: Ortak mı, Bireysel mi? */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1">
              Kapsam (Ortak mı, Bireysel mi?)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setKimeAit("ortak")}
                className={`py-2 px-2 rounded-xl border text-xs font-black transition cursor-pointer flex flex-col items-center gap-1 ${
                  kimeAit === "ortak"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500 shadow-xs ring-1 ring-purple-500/30"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
              >
                <span>👥 Ortak</span>
                <span className="text-[9px] font-normal text-muted">50/50 Bölüş</span>
              </button>

              <button
                type="button"
                onClick={() => setKimeAit("mert")}
                className={`py-2 px-2 rounded-xl border text-xs font-black transition cursor-pointer flex flex-col items-center gap-1 ${
                  kimeAit === "mert"
                    ? "bg-sky-500/20 text-sky-400 border-sky-500 shadow-xs ring-1 ring-sky-500/30"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
              >
                <span>👤 Bireysel (Mert)</span>
                <span className="text-[9px] font-normal text-muted">%100 Mert</span>
              </button>

              <button
                type="button"
                onClick={() => setKimeAit("havsa")}
                className={`py-2 px-2 rounded-xl border text-xs font-black transition cursor-pointer flex flex-col items-center gap-1 ${
                  kimeAit === "havsa"
                    ? "bg-pink-500/20 text-pink-400 border-pink-500 shadow-xs ring-1 ring-pink-500/30"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
              >
                <span>👤 Bireysel (Havsa)</span>
                <span className="text-[9px] font-normal text-muted">%100 Havsa</span>
              </button>
            </div>
            <p className="text-[10px] text-muted mt-1.5">
              * Bireysel seçilirse harcama ortak havuza dahil edilmez, doğrudan o kişinin bireysel giderine yazılır.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block mb-1">
              Kimin Kartı / Hesabından Ödendi?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOdenenKisi("mert")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                  odenenKisi === "mert"
                    ? "bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-xs"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
              >
                <span>👤</span>
                <span>Mert Ödedi</span>
              </button>

              <button
                type="button"
                onClick={() => setOdenenKisi("havsa")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                  odenenKisi === "havsa"
                    ? "bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-xs"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
              >
                <span>👤</span>
                <span>Havsa Ödedi</span>
              </button>
            </div>
            <p className="text-[10px] text-muted mt-1.5">
              * Kimin ödediğinden bağımsız olarak harcama seçilen kapsamdaki kişinin yükümlülüğüne yazılır.
            </p>
          </div>

          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-raised border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={tumGiderToplamlarindaHaric}
              onChange={(e) => setTumGiderToplamlarindaHaric(e.target.checked)}
              className="accent-primary rounded-sm w-4 h-4"
            >
            </input>
            <span className="font-bold text-foreground">
              Genel Ev Toplamlarından Hariç Tut
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button h-10 px-4 text-xs font-bold"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="primary-button h-10 px-5 text-xs font-black shadow-xs"
            >
              {initialData ? "Değişiklikleri Kaydet" : "Kartı Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ------------------------------------------------------------------
// 2. PARA TRANSFERİ MODALI (BORÇ ÖDEME / HESAPLAŞMA)
// ------------------------------------------------------------------

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transfer: {
    gonderen: KullaniciId;
    alan: KullaniciId;
    tutar: number;
    tarih?: string;
    aciklama?: string;
    bireyselGidereYansit?: boolean;
  }) => void;
  onerilenBorclu: "mert" | "havsa" | "esit";
  onerilenTutar: number;
}

export function ParaTransferiModalV2({
  isOpen,
  onClose,
  onSave,
  onerilenBorclu,
  onerilenTutar,
}: TransferModalProps) {
  const [gonderen, setGonderen] = useState<KullaniciId>("havsa");
  const [alan, setAlan] = useState<KullaniciId>("mert");
  const [tutarStr, setTutarStr] = useState("");
  const [tarih, setTarih] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [bireyselGidereYansit, setBireyselGidereYansit] = useState(false);

  useEffect(() => {
    if (onerilenBorclu === "havsa") {
      setGonderen("havsa");
      setAlan("mert");
      setTutarStr(tutarMetniInputIcin(onerilenTutar));
    } else if (onerilenBorclu === "mert") {
      setGonderen("mert");
      setAlan("havsa");
      setTutarStr(tutarMetniInputIcin(onerilenTutar));
    } else {
      setGonderen("havsa");
      setAlan("mert");
      setTutarStr("");
    }
    setTarih(new Date().toISOString().split("T")[0]);
    setAciklama("Aylık mahsuplaşma havalesi");
    setBireyselGidereYansit(false);
  }, [onerilenBorclu, onerilenTutar, isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = Number(tutarStr.replace(",", "."));
    if (!Number.isFinite(tutar) || tutar <= 0) return;

    onSave({
      gonderen,
      alan,
      tutar,
      tarih: tarih || undefined,
      aciklama: aciklama.trim() || undefined,
      bireyselGidereYansit,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md p-6 rounded-3xl bg-surface border border-border shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💸</span>
            <h3 className="text-base font-black text-foreground">
              Para Transferi / Borç Ödemesi Kaydet
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Gönderen ve Alan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted block mb-1">
                Parayı Gönderen
              </label>
              <select
                value={gonderen}
                onChange={(e) => {
                  const val = e.target.value as KullaniciId;
                  setGonderen(val);
                  setAlan(val === "mert" ? "havsa" : "mert");
                }}
                className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border text-xs font-black text-foreground"
              >
                <option value="havsa">Havsa</option>
                <option value="mert">Mert</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted block mb-1">
                Parayı Alan
              </label>
              <select
                value={alan}
                onChange={(e) => {
                  const val = e.target.value as KullaniciId;
                  setAlan(val);
                  setGonderen(val === "mert" ? "havsa" : "mert");
                }}
                className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border text-xs font-black text-foreground"
              >
                <option value="mert">Mert</option>
                <option value="havsa">Havsa</option>
              </select>
            </div>
          </div>

          {/* Tutar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Transfer Tutarı (₺)
              </label>
              {onerilenTutar > 0 && (
                <button
                  type="button"
                  onClick={() => setTutarStr(tutarMetniInputIcin(onerilenTutar))}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Tam Borcu Doldur ({para(onerilenTutar)})
                </button>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              required
              value={tutarStr}
              onChange={(e) => setTutarStr(e.target.value)}
              placeholder="0,00"
              className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border text-sm font-black text-foreground font-mono focus:border-primary transition"
            />
          </div>

          {/* Tarih ve Açıklama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted block mb-1">
                Tarih
              </label>
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border text-xs font-bold text-foreground"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted block mb-1">
                Açıklama
              </label>
              <input
                type="text"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Örn: Ekim Ayı Mahsuplaşması"
                className="w-full h-10 px-3 rounded-xl bg-surface-raised border border-border text-xs font-semibold text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button h-10 px-4 text-xs font-bold"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="primary-button h-10 px-5 text-xs font-black shadow-xs"
            >
              Transferi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ------------------------------------------------------------------
// 3. ONAY MODALLARI (ÖNCEKİ AYI KOPYALA / SIFIRLA)
// ------------------------------------------------------------------

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  isDanger?: boolean;
}

export function OnayModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  isDanger,
}: ConfirmModalProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-surface border border-border shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
              isDanger
                ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                : "bg-primary/15 text-primary border border-primary/30"
            }`}
          >
            {isDanger ? "⚠️" : "🔄"}
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">{title}</h3>
            <p className="text-[11px] text-muted mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button h-9 px-3.5 text-xs font-bold"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-9 px-4 text-xs font-black rounded-xl transition cursor-pointer shadow-xs ${
              isDanger
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-primary hover:bg-primary-hover text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ------------------------------------------------------------------
// 4. AYLIK ÖZET RAPOR MODALI (WHATSAPP / PANO)
// ------------------------------------------------------------------

interface OzetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ayEtiketiStr: string;
  veri: AyHaneGiderVerisi;
  calc: GiderV2Calculations;
  onCopySuccess: () => void;
}

export function OzetRaporModalV2({
  isOpen,
  onClose,
  ayEtiketiStr,
  veri,
  calc,
  onCopySuccess,
}: OzetModalProps) {
  if (!isOpen || typeof document === "undefined") return null;

  const {
    mertGider,
    havsaGider,
    mertGelir,
    havsaGelir,
    mertKalan,
    havsaKalan,
    evGideriToplami,
    evGelirToplami,
    evKalan,
    mahsuplasma,
  } = calc;

  const raporMetni = `📊 *HANE GİDER & BÜTÇE RAPORU (${ayEtiketiStr})*

🏠 *GENEL HANE DURUMU:*
• Toplam Giriş Gideri: ${para(evGideriToplami)}
• Toplam Gelir: ${para(evGelirToplami)}
• Net Aile Bakiyesi: ${para(evKalan)}

👤 *MERT:*
• Gelir: ${para(mertGelir)}
• Gider (Ortak+Bireysel): ${para(mertGider)}
• Net Bakiye: ${para(mertKalan)}

👤 *HAVSA:*
• Gelir: ${para(havsaGelir)}
• Gider (Ortak+Bireysel): ${para(havsaGider)}
• Net Bakiye: ${para(havsaKalan)}

🤝 *AY SONU NET MAHSUPLAŞMA:*
• ${mahsuplasma.durumMetni}

💳 *KARTLAR & ORTAK KALEMLER:*
${veri.krediKartlari
  .map(
    (k) =>
      `• ${k.ad}: ${para(k.toplamEkstre)} (Ödeyen: ${
        k.odenenKisi ? ODEYEN_ETIKET[k.odenenKisi] : "Mert"
      })`
  )
  .join("\n")}
`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(raporMetni);
    onCopySuccess();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-surface border border-border shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📋</span>
            <h3 className="text-base font-black text-foreground">
              {ayEtiketiStr} Bütçe & Gider Özeti
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-raised border border-border/70 font-mono text-[11px] leading-relaxed max-h-[320px] overflow-y-auto whitespace-pre-wrap text-foreground">
          {raporMetni}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/70">
          <span className="text-[11px] text-muted">
            WhatsApp veya Notlara yapıştırmaya hazır format
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button h-9 px-3.5 text-xs font-bold"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="primary-button h-9 px-4 text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>Metni Kopyala</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
