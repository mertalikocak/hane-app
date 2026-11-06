"use client";

import { useState, useEffect, useMemo } from "react";
import {
  WeddingPiggyContribution,
  WeddingKisi,
  GoldType,
  GoldPricesResponse,
} from "@/domain/weddingTypes";
import {
  addPiggyContribution,
  updatePiggyContribution,
  deletePiggyContribution,
} from "@/storage/weddingStorage";
import { CloseIcon, TrashIcon, EditIcon } from "@/components/ui/Icons";

interface KumbaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  katkilar: WeddingPiggyContribution[];
  onDataChange: () => void;
  defaultKisi?: WeddingKisi;
  goldPrices?: GoldPricesResponse | null;
  editingContribution?: WeddingPiggyContribution | null;
  onClearEditing?: () => void;
  initialTab?: "nakit" | "altin" | "gecmis";
}

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

const formatSayi = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(n);

const GOLD_METAS: Record<
  GoldType,
  { label: string; icon: string; isDecimal: boolean; defaultStep: string }
> = {
  gram: { label: "Gram Altın", icon: "🪙", isDecimal: true, defaultStep: "0.01" },
  ceyrek: { label: "Çeyrek Altın", icon: "🟡", isDecimal: false, defaultStep: "1" },
  yarim: { label: "Yarım Altın", icon: "🟠", isDecimal: false, defaultStep: "1" },
  tam: { label: "Tam Altın", icon: "👑", isDecimal: false, defaultStep: "1" },
};

export function KumbaraModal({
  isOpen,
  onClose,
  katkilar,
  onDataChange,
  defaultKisi = "mert",
  goldPrices,
  editingContribution = null,
  onClearEditing,
  initialTab = "nakit",
}: KumbaraModalProps) {
  // Aktif sekme: nakit, altin veya gecmis
  const [activeTab, setActiveTab] = useState<"nakit" | "altin" | "gecmis">(initialTab);

  // Ortak Alanlar
  const [ekleyenKisi, setEkleyenKisi] = useState<WeddingKisi>(defaultKisi);
  const [aciklama, setAciklama] = useState<string>("");
  const [tarih, setTarih] = useState<string>(() => new Date().toISOString().split("T")[0]);

  // Nakit Formu State
  const [nakitTutarStr, setNakitTutarStr] = useState<string>("");

  // Altın Formu State
  const [seciliGoldType, setSeciliGoldType] = useState<GoldType>("ceyrek");
  const [altinMiktarStr, setAltinMiktarStr] = useState<string>("1");
  const [birimAlisFiyatiStr, setBirimAlisFiyatiStr] = useState<string>("");

  // Bildirimler ve Hatalar
  const [hata, setHata] = useState<string | null>(null);
  const [basariliMesaji, setBasariliMesaji] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Güncel seçili altın türünün canlı piyasa alış fiyatı
  const guncelPiyasaAlisFiyati = useMemo(() => {
    return goldPrices?.kalemler?.[seciliGoldType]?.alis || 0;
  }, [goldPrices, seciliGoldType]);

  // Düzenleme modu veya başlangıç sekmesi belirlendiğinde state'leri doldur
  useEffect(() => {
    if (editingContribution) {
      setEkleyenKisi(editingContribution.ekleyenKisi || "mert");
      setTarih(editingContribution.tarih || new Date().toISOString().split("T")[0]);
      setAciklama(editingContribution.aciklama || "");

      if (editingContribution.assetType === "gold") {
        setActiveTab("altin");
        setSeciliGoldType(editingContribution.goldType || "gram");
        setAltinMiktarStr(String(editingContribution.miktar ?? 1));
        setBirimAlisFiyatiStr(String(editingContribution.birimAlisFiyati ?? ""));
      } else {
        setActiveTab("nakit");
        setNakitTutarStr(String(editingContribution.tutar ?? ""));
      }
    } else {
      setActiveTab(initialTab);
    }
  }, [editingContribution, initialTab]);

  // Altın türü değiştiğinde birim alış fiyatı boşsa güncel piyasa fiyatını öner
  useEffect(() => {
    if (!editingContribution && guncelPiyasaAlisFiyati > 0 && !birimAlisFiyatiStr) {
      setBirimAlisFiyatiStr(String(Math.round(guncelPiyasaAlisFiyati)));
    }
  }, [seciliGoldType, guncelPiyasaAlisFiyati, birimAlisFiyatiStr, editingContribution]);

  if (!isOpen) return null;

  // Otomatik hesaplanan toplam alış maliyeti
  const parsedAltinMiktar = parseFloat(altinMiktarStr.replace(",", ".")) || 0;
  const parsedBirimAlisFiyati = parseFloat(birimAlisFiyatiStr.replace(",", ".")) || 0;
  const hesaplananToplamMaliyet = parsedAltinMiktar * parsedBirimAlisFiyati;

  const handleNakitKaydet = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = parseFloat(nakitTutarStr.replace(/\./g, "").replace(",", "."));
    if (isNaN(tutar) || tutar <= 0) {
      setHata("Lütfen geçerli bir nakit tutarı girin.");
      return;
    }

    const kisiAd =
      ekleyenKisi === "mert"
        ? "Mert"
        : ekleyenKisi === "havsa"
        ? "Havsa"
        : ekleyenKisi === "ortak"
        ? "Ortak"
        : "Aile / Hediye";

    if (editingContribution) {
      updatePiggyContribution({
        ...editingContribution,
        assetType: "cash",
        ekleyenKisi,
        ekleyenKisiAd: kisiAd,
        tutar,
        tarih: tarih || new Date().toISOString().split("T")[0],
        aciklama: aciklama.trim() || undefined,
        goldType: undefined,
        miktar: undefined,
        birimAlisFiyati: undefined,
        toplamAlisMaliyeti: undefined,
      });
      setBasariliMesaji("Nakit kaydı başarıyla güncellendi.");
    } else {
      addPiggyContribution({
        assetType: "cash",
        ekleyenKisi,
        ekleyenKisiAd: kisiAd,
        tutar,
        tarih: tarih || new Date().toISOString().split("T")[0],
        aciklama: aciklama.trim() || undefined,
      });
      setBasariliMesaji("Nakit kumbaraya başarıyla eklendi.");
    }

    resetForm();
    onDataChange();
    setTimeout(() => {
      setBasariliMesaji(null);
      if (editingContribution && onClearEditing) onClearEditing();
      onClose();
    }, 900);
  };

  const handleAltinKaydet = (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedAltinMiktar <= 0) {
      setHata("Lütfen geçerli bir altın miktarı girin.");
      return;
    }

    if (parsedBirimAlisFiyati <= 0) {
      setHata("Lütfen altını satın aldığınız birim alış fiyatını girin.");
      return;
    }

    const kisiAd =
      ekleyenKisi === "mert"
        ? "Mert"
        : ekleyenKisi === "havsa"
        ? "Havsa"
        : ekleyenKisi === "ortak"
        ? "Ortak"
        : "Aile / Hediye";

    if (editingContribution) {
      updatePiggyContribution({
        ...editingContribution,
        assetType: "gold",
        ekleyenKisi,
        ekleyenKisiAd: kisiAd,
        tutar: hesaplananToplamMaliyet, // maliyet
        tarih: tarih || new Date().toISOString().split("T")[0],
        aciklama: aciklama.trim() || undefined,
        goldType: seciliGoldType,
        miktar: parsedAltinMiktar,
        birimAlisFiyati: parsedBirimAlisFiyati,
        toplamAlisMaliyeti: hesaplananToplamMaliyet,
      });
      setBasariliMesaji("Altın kaydı başarıyla güncellendi.");
    } else {
      addPiggyContribution({
        assetType: "gold",
        ekleyenKisi,
        ekleyenKisiAd: kisiAd,
        tutar: hesaplananToplamMaliyet,
        tarih: tarih || new Date().toISOString().split("T")[0],
        aciklama: aciklama.trim() || undefined,
        goldType: seciliGoldType,
        miktar: parsedAltinMiktar,
        birimAlisFiyati: parsedBirimAlisFiyati,
        toplamAlisMaliyeti: hesaplananToplamMaliyet,
      });
      setBasariliMesaji("Altın başarıyla kumbaraya kaydedildi.");
    }

    resetForm();
    onDataChange();
    setTimeout(() => {
      setBasariliMesaji(null);
      if (editingContribution && onClearEditing) onClearEditing();
      onClose();
    }, 900);
  };

  const resetForm = () => {
    setNakitTutarStr("");
    setAltinMiktarStr("1");
    setBirimAlisFiyatiStr("");
    setAciklama("");
    setHata(null);
  };

  const handleConfirmSil = (id: string) => {
    deletePiggyContribution(id);
    setConfirmDeleteId(null);
    onDataChange();
  };

  const hazirAciklamalarNakit = [
    "Maaş birikimi",
    "Altın bozdurma",
    "Aile desteği",
    "Düğün takısı",
    "Ek gelir",
  ];

  const hazirAciklamalarAltin = [
    "Düğün takısı",
    "Yatırımlık altın",
    "Aile hediyesi",
    "Nişan / Söz hediyesi",
    "Kendi birikimimiz",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/70 border border-border-lavender flex items-center justify-center text-xl shrink-0">
              {activeTab === "altin" ? "🪙" : "💵"}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {editingContribution ? "Kumbara Kaydını Düzenle" : "Düğün Kumbarasına Varlık Ekle"}
              </h3>
              <p className="text-xs text-muted">
                {editingContribution
                  ? "Seçilen kumbara kaydını güncelleyin"
                  : "Nakit veya fiziksel altın birikiminizi kumbaraya kaydedin"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (editingContribution && onClearEditing) onClearEditing();
              onClose();
            }}
            className="icon-button h-8 w-8 text-muted hover:text-foreground"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Başarı Bildirimi */}
        {basariliMesaji && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in">
            <span>✅</span>
            <span>{basariliMesaji}</span>
          </div>
        )}

        {/* Hata Bildirimi */}
        {hata && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 text-xs font-bold flex items-center gap-2 shrink-0">
            <span>⚠️</span>
            <span>{hata}</span>
          </div>
        )}

        {/* Ana İki Seçenek Sekmesi (Nakit Ekle / Altın Ekle) */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-raised border border-border shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("nakit");
              setHata(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "nakit"
                ? "bg-surface text-primary border border-border shadow-2xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>💵</span> Nakit Ekle
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("altin");
              setHata(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "altin"
                ? "bg-surface text-amber-700 border border-border shadow-2xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>🪙</span> Altın Ekle
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("gecmis");
              setHata(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "gecmis"
                ? "bg-surface text-foreground border border-border shadow-2xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>📜</span> Geçmiş ({katkilar.length})
          </button>
        </div>

        {/* 1. SEÇENEK: NAKİT EKLE */}
        {activeTab === "nakit" && (
          <form onSubmit={handleNakitKaydet} className="space-y-4 overflow-y-auto pr-1">
            {/* Ekleyen Kişi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Ekleyen Kişi</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("mert")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "mert"
                      ? "border-sky-500 bg-sky-500/15 text-sky-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>👤</span>
                  <span>Mert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("havsa")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "havsa"
                      ? "border-pink-500 bg-pink-500/15 text-pink-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>👩</span>
                  <span>Havsa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("ortak")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "ortak"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>👥</span>
                  <span>Ortak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("diger")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "diger"
                      ? "border-amber-500 bg-amber-500/15 text-amber-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>🎁</span>
                  <span>Aile</span>
                </button>
              </div>
            </div>

            {/* Tutar (TL) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tutar (TL)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="Örn: 15000"
                  value={nakitTutarStr}
                  onChange={(e) => setNakitTutarStr(e.target.value)}
                  className="field pr-12 font-bold text-lg tabular-nums"
                  autoFocus
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                  ₺
                </span>
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Açıklama / Kaynak (İsteğe Bağlı)
              </label>
              <input
                type="text"
                placeholder="Örn: Kasım ayı birikimi"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                className="field text-xs"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hazirAciklamalarNakit.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setAciklama(h)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-surface-raised border border-border text-muted hover:text-foreground transition cursor-pointer"
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
                onClick={() => {
                  if (editingContribution && onClearEditing) onClearEditing();
                  onClose();
                }}
                className="secondary-button px-4 py-2 text-xs"
              >
                Vazgeç
              </button>
              <button type="submit" className="primary-button px-5 py-2 text-xs">
                <span>💵</span> {editingContribution ? "Değişiklikleri Kaydet" : "Kumbaraya Nakit Ekle"}
              </button>
            </div>
          </form>
        )}

        {/* 2. SEÇENEK: ALTIN EKLE */}
        {activeTab === "altin" && (
          <form onSubmit={handleAltinKaydet} className="space-y-4 overflow-y-auto pr-1">
            {/* Altın Türü */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Altın Türü</label>
                {goldPrices?.updatedAt && (
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <span>📡</span>
                    <span>Canlı API Alış Fiyatları</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["gram", "ceyrek", "yarim", "tam"] as GoldType[]).map((type) => {
                  const meta = GOLD_METAS[type];
                  const livePrice = goldPrices?.kalemler?.[type]?.alis;
                  const isSelected = seciliGoldType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSeciliGoldType(type);
                        if (livePrice && (!birimAlisFiyatiStr || !editingContribution)) {
                          setBirimAlisFiyatiStr(String(Math.round(livePrice)));
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/15 shadow-2xs"
                          : "border-border bg-surface-raised hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{meta.icon}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-bold text-foreground block">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-muted block tabular-nums">
                          {livePrice ? `Alış: ${para(livePrice)}` : "Fiyat alınıyor..."}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adet / Miktar */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Adet / Miktar</span>
                <span className="text-[10px] text-muted font-normal">
                  {seciliGoldType === "gram"
                    ? "Gram altında küsuratlı girilebilir (ör. 2.50)"
                    : "Tam adet giriniz (ör. 1, 2, 3)"}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={GOLD_METAS[seciliGoldType].defaultStep}
                  min={seciliGoldType === "gram" ? "0.01" : "1"}
                  placeholder={seciliGoldType === "gram" ? "2.50" : "1"}
                  value={altinMiktarStr}
                  onChange={(e) => setAltinMiktarStr(e.target.value)}
                  className="field pr-16 font-bold text-base tabular-nums"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
                  {seciliGoldType === "gram" ? "Gram" : "Adet"}
                </span>
              </div>
            </div>

            {/* Alış Fiyatı (Birim Fiyat) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Birim Alış Fiyatı (TL)
                </label>
                {guncelPiyasaAlisFiyati > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setBirimAlisFiyatiStr(String(Math.round(guncelPiyasaAlisFiyati)))
                    }
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Piyasa Alış Fiyatını Al ({para(guncelPiyasaAlisFiyati)})
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="Kullanıcının satın aldığı birim fiyat (TL)"
                  value={birimAlisFiyatiStr}
                  onChange={(e) => setBirimAlisFiyatiStr(e.target.value)}
                  className="field pr-12 font-bold text-base tabular-nums"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                  ₺
                </span>
              </div>
            </div>

            {/* Otomatik Hesaplanan Toplam Alış Maliyeti */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Toplam Alış Maliyeti
                </span>
                <span className="text-xs text-muted">
                  {parsedAltinMiktar || 0} {seciliGoldType === "gram" ? "gr" : "adet"} ×{" "}
                  {para(parsedBirimAlisFiyati || 0)}
                </span>
              </div>
              <div className="text-lg font-bold text-foreground tabular-nums">
                {para(hesaplananToplamMaliyet)}
              </div>
            </div>

            {/* Ekleyen Kişi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Ekleyen Kişi</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("mert")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "mert"
                      ? "border-sky-500 bg-sky-500/15 text-sky-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>👤</span>
                  <span>Mert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("havsa")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "havsa"
                      ? "border-pink-500 bg-pink-500/15 text-pink-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>👩</span>
                  <span>Havsa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("ortak")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "ortak"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>👥</span>
                  <span>Ortak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEkleyenKisi("diger")}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    ekleyenKisi === "diger"
                      ? "border-amber-500 bg-amber-500/15 text-amber-700"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  <span>🎁</span>
                  <span>Aile</span>
                </button>
              </div>
            </div>

            {/* Alış Tarihi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Alış Tarihi</label>
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                className="field text-xs tabular-nums"
              />
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Açıklama (İsteğe Bağlı)
              </label>
              <input
                type="text"
                placeholder="Örn: Nişanda kayınvalideden gelen çeyrek"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                className="field text-xs"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hazirAciklamalarAltin.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setAciklama(h)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-surface-raised border border-border text-muted hover:text-foreground transition cursor-pointer"
                  >
                    + {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  if (editingContribution && onClearEditing) onClearEditing();
                  onClose();
                }}
                className="secondary-button px-4 py-2 text-xs"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="primary-button bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 text-xs"
              >
                <span>🪙</span> {editingContribution ? "Değişiklikleri Kaydet" : "Kumbaraya Altın Ekle"}
              </button>
            </div>
          </form>
        )}

        {/* 3. SEÇENEK: İŞLEM GEÇMİŞİ */}
        {activeTab === "gecmis" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {katkilar.length === 0 ? (
              <div className="py-12 text-center text-muted text-xs">
                Kumbaraya henüz nakit veya altın eklenmedi.
              </div>
            ) : (
              katkilar.map((k) => {
                const isGold = k.assetType === "gold";
                const goldType = k.goldType || "gram";

                return (
                  <div
                    key={k.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-surface border border-border shrink-0">
                        {isGold
                          ? GOLD_METAS[goldType].icon
                          : k.ekleyenKisi === "mert"
                          ? "👤"
                          : k.ekleyenKisi === "havsa"
                          ? "👩"
                          : k.ekleyenKisi === "ortak"
                          ? "👥"
                          : "🎁"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {isGold
                              ? `${formatSayi(k.miktar || 0)} ${
                                  goldType === "gram" ? "Gram" : "Adet"
                                } ${GOLD_METAS[goldType].label}`
                              : k.ekleyenKisi === "mert"
                              ? "Mert"
                              : k.ekleyenKisi === "havsa"
                              ? "Havsa"
                              : k.ekleyenKisi === "ortak"
                              ? "Ortak"
                              : "Aile / Diğer"}
                          </span>
                          <span className="text-[10px] text-muted tabular-nums">{k.tarih}</span>
                          {isGold && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 font-bold">
                              Altın
                            </span>
                          )}
                        </div>
                        {isGold ? (
                          <div className="text-[11px] text-muted tabular-nums">
                            Birim Alış: {para(k.birimAlisFiyati || 0)} • Ekleyen:{" "}
                            {k.ekleyenKisi === "mert"
                              ? "Mert"
                              : k.ekleyenKisi === "havsa"
                              ? "Havsa"
                              : k.ekleyenKisi === "ortak"
                              ? "Ortak"
                              : "Aile"}
                          </div>
                        ) : null}
                        {k.aciklama && (
                          <p className="text-[11px] text-muted italic">&ldquo;{k.aciklama}&rdquo;</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-xs tabular-nums ${
                          isGold ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        +{para(k.tutar)}
                      </span>

                      {/* Düzenle Butonu */}
                      <button
                        type="button"
                        onClick={() => {
                          if (k.assetType === "gold") {
                            setActiveTab("altin");
                            setSeciliGoldType(k.goldType || "gram");
                            setAltinMiktarStr(String(k.miktar ?? 1));
                            setBirimAlisFiyatiStr(String(k.birimAlisFiyati ?? ""));
                          } else {
                            setActiveTab("nakit");
                            setNakitTutarStr(String(k.tutar ?? ""));
                          }
                          setEkleyenKisi(k.ekleyenKisi || "mert");
                          setTarih(k.tarih || new Date().toISOString().split("T")[0]);
                          setAciklama(k.aciklama || "");
                          // We can trigger edit mode
                        }}
                        className="icon-button h-7 w-7 text-muted hover:text-primary"
                        title="Forma Doldur"
                      >
                        <EditIcon size={12} />
                      </button>

                      {/* Sil Butonu */}
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
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
