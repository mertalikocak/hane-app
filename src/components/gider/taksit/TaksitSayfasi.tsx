"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { TaksitKarti, TaksitKalemi, TaksitSahibi } from "@/domain/taksitTypes";
import {
  getTaksitKartlari,
  getTaksitler,
  addTaksit,
  updateTaksit,
  deleteTaksit,
  incrementTaksit,
  decrementTaksit,
  addTaksitKarti,
  updateTaksitKarti,
  deleteTaksitKarti,
  incrementAllTaksitlerForKart,
  hesaplaKartSonOdemeDurumu,
  TAKSiT_UPDATED_EVENT,
} from "@/storage/taksitStorage";
import { TaksitKartGrubu } from "./TaksitKartGrubu";
import { TaksitModal } from "./TaksitModal";
import { KartModal } from "./KartModal";
import { TaksitProjeksiyonu } from "./TaksitProjeksiyonu";
import { TaksitAktarimModal } from "./TaksitAktarimModal";

const paraFormat = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

export function TaksitSayfasi() {
  const [kartlar, setKartlar] = useState<TaksitKarti[]>([]);
  const [taksitler, setTaksitler] = useState<TaksitKalemi[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filtreler
  const [filterSahip, setFilterSahip] = useState<"tum" | TaksitSahibi>("tum");
  const [filterDurum, setFilterDurum] = useState<"devam" | "tum" | "biten">("devam");

  // Modallar
  const [isTaksitModalOpen, setIsTaksitModalOpen] = useState(false);
  const [editingTaksit, setEditingTaksit] = useState<TaksitKalemi | null>(null);
  const [targetKartId, setTargetKartId] = useState<string | undefined>(undefined);

  const [isKartModalOpen, setIsKartModalOpen] = useState(false);
  const [editingKart, setEditingKart] = useState<TaksitKarti | null>(null);

  const [isAktarimModalOpen, setIsAktarimModalOpen] = useState(false);
  const [aktarimMesaj, setAktarimMesaj] = useState<string | null>(null);

  // Akordiyon: Katlanmış (Gizlenmiş) Kart ID'leri
  const [collapsedKartIds, setCollapsedKartIds] = useState<string[]>([]);

  const toggleKartCollapse = (kartId: string) => {
    setCollapsedKartIds((prev) =>
      prev.includes(kartId) ? prev.filter((id) => id !== kartId) : [...prev, kartId]
    );
  };

  const toggleAllCollapse = () => {
    if (collapsedKartIds.length === kartlar.length) {
      setCollapsedKartIds([]);
    } else {
      setCollapsedKartIds(kartlar.map((k) => k.id));
    }
  };

  const projeksiyonRef = React.useRef<HTMLDivElement>(null);

  const scrollToProjeksiyon = () => {
    if (projeksiyonRef.current) {
      projeksiyonRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const refreshData = useCallback(() => {
    setKartlar(getTaksitKartlari());
    setTaksitler(getTaksitler());
  }, []);

  useEffect(() => {
    refreshData();
    setIsLoaded(true);

    const handleUpdate = () => refreshData();
    window.addEventListener(TAKSiT_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(TAKSiT_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refreshData]);

  // Toplam İstatistikler
  const stats = useMemo(() => {
    // Sadece aktif (hesaplara dahil) kartların taksitlerini al
    const aktifKartIdSet = new Set(
      kartlar.filter((k) => k.aktif !== false).map((k) => k.id)
    );

    const dahilOlanTaksitler = taksitler.filter((t) => aktifKartIdSet.has(t.kartId));
    const aktifler = dahilOlanTaksitler.filter((t) => t.odenenTaksit < t.toplamTaksit);

    const toplamAylik = aktifler.reduce((s, t) => s + t.aylikTutar, 0);
    const mertBireyselAylik = aktifler
      .filter((t) => t.sahip === "mert")
      .reduce((s, t) => s + t.aylikTutar, 0);
    const havsaBireyselAylik = aktifler
      .filter((t) => t.sahip === "havsa")
      .reduce((s, t) => s + t.aylikTutar, 0);
    const ortakAylik = aktifler
      .filter((t) => t.sahip === "ortak")
      .reduce((s, t) => s + t.aylikTutar, 0);

    const ortakPay = Math.round((ortakAylik / 2) * 100) / 100;
    const mertToplamPay = mertBireyselAylik + ortakPay;
    const havsaToplamPay = havsaBireyselAylik + ortakPay;

    const mertKalanBorc = aktifler
      .filter((t) => t.sahip === "mert")
      .reduce((s, t) => s + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar, 0);
    const havsaKalanBorc = aktifler
      .filter((t) => t.sahip === "havsa")
      .reduce((s, t) => s + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar, 0);
    const ortakKalanBorc = aktifler
      .filter((t) => t.sahip === "ortak")
      .reduce((s, t) => s + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar, 0);

    const toplamKalanBorc = mertKalanBorc + havsaKalanBorc + ortakKalanBorc;

    return {
      toplamAylik,
      mertBireyselAylik,
      havsaBireyselAylik,
      ortakAylik,
      ortakPay,
      mertToplamPay,
      havsaToplamPay,
      toplamKalanBorc,
      mertKalanBorc,
      havsaKalanBorc,
      ortakKalanBorc,
      aktifTaksitSayisi: aktifler.length,
      toplamTaksitSayisi: dahilOlanTaksitler.length,
      haricKartSayisi: kartlar.filter((k) => k.aktif === false).length,
    };
  }, [taksitler, kartlar]);

  // Filtrelenmiş Taksitler
  const filteredTaksitler = useMemo(() => {
    return taksitler.filter((t) => {
      // Sahip Filtresi
      if (filterSahip !== "tum" && t.sahip !== filterSahip) return false;

      // Durum Filtresi
      const isCompleted = t.odenenTaksit >= t.toplamTaksit;
      if (filterDurum === "devam" && isCompleted) return false;
      if (filterDurum === "biten" && !isCompleted) return false;

      return true;
    });
  }, [taksitler, filterSahip, filterDurum]);

  // Kartları taksit sayısına göre sırala (En çok taksiti olan kart en üstte çıksın)
  const sortedKartlar = useMemo(() => {
    return [...kartlar].sort((a, b) => {
      // 1. Bu karta ait filtrelenmiş taksit sayısı (çoktan aza)
      const aCount = filteredTaksitler.filter((t) => t.kartId === a.id).length;
      const bCount = filteredTaksitler.filter((t) => t.kartId === b.id).length;

      if (bCount !== aCount) {
        return bCount - aCount;
      }

      // 2. Eşitlik durumunda toplam borç tutarına göre sırala
      const aBorc = filteredTaksitler
        .filter((t) => t.kartId === a.id)
        .reduce((sum, t) => sum + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar, 0);
      const bBorc = filteredTaksitler
        .filter((t) => t.kartId === b.id)
        .reduce((sum, t) => sum + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar, 0);

      return bBorc - aBorc;
    });
  }, [kartlar, filteredTaksitler]);

  // Yaklaşan Son Ödemeler (5 gün ve daha az kalan aktif kartlar)
  const yaklasanOdemeler = useMemo(() => {
    return kartlar
      .filter((k) => k.aktif !== false)
      .map((k) => {
        const buKartaAitAktifler = taksitler.filter(
          (t) => t.kartId === k.id && t.odenenTaksit < t.toplamTaksit
        );
        if (buKartaAitAktifler.length === 0) return null;

        const durum = hesaplaKartSonOdemeDurumu(k);
        if (durum.kalanGun <= 5) {
          const aylikTutar = buKartaAitAktifler.reduce((s, t) => s + t.aylikTutar, 0);
          return {
            kart: k,
            durum,
            aylikTutar,
            taksitSayisi: buKartaAitAktifler.length,
          };
        }
        return null;
      })
      .filter(
        (item): item is {
          kart: TaksitKarti;
          durum: ReturnType<typeof hesaplaKartSonOdemeDurumu>;
          aylikTutar: number;
          taksitSayisi: number;
        } => item !== null
      );
  }, [kartlar, taksitler]);

  // Eylemler
  const handleOpenAddTaksit = (kartId?: string) => {
    setEditingTaksit(null);
    setTargetKartId(kartId);
    setIsTaksitModalOpen(true);
  };

  const handleOpenEditTaksit = (taksit: TaksitKalemi) => {
    setEditingTaksit(taksit);
    setTargetKartId(taksit.kartId);
    setIsTaksitModalOpen(true);
  };

  const handleSaveTaksit = (input: Omit<TaksitKalemi, "id" | "createdAt">) => {
    if (editingTaksit) {
      updateTaksit(editingTaksit.id, input);
    } else {
      addTaksit(input);
    }
    refreshData();
  };

  const handleIncrement = (id: string) => {
    incrementTaksit(id);
    refreshData();
  };

  const handleDecrement = (id: string) => {
    decrementTaksit(id);
    refreshData();
  };

  const handleDeleteTaksit = (id: string) => {
    deleteTaksit(id);
    refreshData();
  };

  // Kart Eylemleri
  const handleOpenAddKart = () => {
    setEditingKart(null);
    setIsKartModalOpen(true);
  };

  const handleOpenEditKart = (kart: TaksitKarti) => {
    setEditingKart(kart);
    setIsKartModalOpen(true);
  };

  const handleSaveKart = (input: Omit<TaksitKarti, "id" | "createdAt">) => {
    if (editingKart) {
      updateTaksitKarti(editingKart.id, input);
    } else {
      addTaksitKarti(input);
    }
    refreshData();
  };

  const handleDeleteKart = (kartId: string) => {
    deleteTaksitKarti(kartId);
    refreshData();
  };

  const handlePayAllForKart = (kartId: string) => {
    incrementAllTaksitlerForKart(kartId);
    refreshData();
  };

  const handleToggleKartAktif = (kartId: string, aktif: boolean) => {
    updateTaksitKarti(kartId, { aktif });
    refreshData();
  };

  if (!isLoaded) {
    return <div className="h-48 animate-pulse rounded-3xl bg-surface-raised" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Üst İstatistik Kartları (KPI Summary Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Toplam Aylık Taksit Yükü */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Aylık Taksit Yükü
              </span>
              <span className="text-base">💳</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {paraFormat(stats.toplamAylik)}
            </div>
            {stats.haricKartSayisi > 0 && (
              <span className="text-[10px] text-amber-500 font-semibold block mt-0.5">
                ({stats.haricKartSayisi} kart hesaplama dışı)
              </span>
            )}
          </div>
          <div className="pt-2 border-t border-border/60 text-[11px] text-muted flex items-center justify-between">
            <span>Ortak Taksitler Toplamı:</span>
            <span className="font-bold text-foreground">{paraFormat(stats.ortakAylik)}</span>
          </div>
        </div>

        {/* Mert'in Aylık Taksit Payı */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Mert'in Taksit Payı
              </span>
              <span className="text-base">👤</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {paraFormat(stats.mertToplamPay)}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold">
                Bireysel
              </span>
              <span className="font-bold text-foreground block truncate">
                {paraFormat(stats.mertBireyselAylik)}
              </span>
            </div>
            <div className="border-l border-border/60 pl-2">
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold">
                Ortak (%50)
              </span>
              <span className="font-bold text-foreground block truncate">
                {paraFormat(stats.ortakPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Havsa'nın Aylık Taksit Payı */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Havsa'nın Taksit Payı
              </span>
              <span className="text-base">👤</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {paraFormat(stats.havsaToplamPay)}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold">
                Bireysel
              </span>
              <span className="font-bold text-foreground block truncate">
                {paraFormat(stats.havsaBireyselAylik)}
              </span>
            </div>
            <div className="border-l border-border/60 pl-2">
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold">
                Ortak (%50)
              </span>
              <span className="font-bold text-foreground block truncate">
                {paraFormat(stats.ortakPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Toplam Kalan Borç */}
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Kalan Toplam Borç
              </span>
              <span className="text-base">⏳</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {paraFormat(stats.toplamKalanBorc)}
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 grid grid-cols-3 gap-1.5 text-[11px]">
            <div>
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold truncate">
                Ortak
              </span>
              <span
                className="font-bold text-foreground block truncate"
                title={paraFormat(stats.ortakKalanBorc)}
              >
                {paraFormat(stats.ortakKalanBorc)}
              </span>
            </div>
            <div className="border-l border-border/60 pl-1.5">
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold truncate">
                Mert
              </span>
              <span
                className="font-bold text-foreground block truncate"
                title={paraFormat(stats.mertKalanBorc)}
              >
                {paraFormat(stats.mertKalanBorc)}
              </span>
            </div>
            <div className="border-l border-border/60 pl-1.5">
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold truncate">
                Havsa
              </span>
              <span
                className="font-bold text-foreground block truncate"
                title={paraFormat(stats.havsaKalanBorc)}
              >
                {paraFormat(stats.havsaKalanBorc)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Yaklaşan Son Ödeme Uyarısı Banner */}
      {yaklasanOdemeler.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 flex-wrap animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <span className="text-xs font-black text-foreground block">
                Yaklaşan Kredi Kartı Son Ödemeleri:
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {yaklasanOdemeler.map(({ kart, durum, aylikTutar }) => (
                  <span
                    key={kart.id}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-surface border border-border shadow-xs"
                  >
                    <span>💳 {kart.ad}:</span>
                    <span
                      className={
                        durum.durum === "bugun"
                          ? "text-rose-500 font-black animate-pulse"
                          : "text-amber-500 font-extrabold"
                      }
                    >
                      {durum.durum === "bugun"
                        ? "Bugün Son Gün!"
                        : `${durum.kalanGun} gün kaldı`}{" "}
                      ({durum.tarihStr})
                    </span>
                    <span className="text-muted text-[11px]">({paraFormat(aylikTutar)})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kontrol Çubuğu & Filtreler (Control Toolbar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-surface border border-border/80 shadow-xs">
        {/* Filtre Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sahip Filtresi */}
          <div className="flex items-center p-1 rounded-2xl bg-surface-raised border border-border/60">
            <button
              type="button"
              onClick={() => setFilterSahip("tum")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterSahip === "tum"
                  ? "bg-surface text-foreground shadow-xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setFilterSahip("mert")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterSahip === "mert"
                  ? "bg-surface text-foreground shadow-xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Mert
            </button>
            <button
              type="button"
              onClick={() => setFilterSahip("havsa")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterSahip === "havsa"
                  ? "bg-surface text-foreground shadow-xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Havsa
            </button>
            <button
              type="button"
              onClick={() => setFilterSahip("ortak")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterSahip === "ortak"
                  ? "bg-surface text-foreground shadow-xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Ortak
            </button>
          </div>

          {/* Durum Filtresi */}
          <div className="flex items-center p-1 rounded-2xl bg-surface-raised border border-border/60">
            <button
              type="button"
              onClick={() => setFilterDurum("devam")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterDurum === "devam"
                  ? "bg-surface text-foreground shadow-xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Devam Edenler ({stats.aktifTaksitSayisi})
            </button>
            <button
              type="button"
              onClick={() => setFilterDurum("tum")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterDurum === "tum"
                  ? "bg-surface text-foreground shadow-xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Hepsi ({stats.toplamTaksitSayisi})
            </button>
          </div>

          {/* Gelecek Ayları Gör Butonu */}
          <button
            type="button"
            onClick={scrollToProjeksiyon}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-surface-raised border border-border/70 text-xs font-bold text-muted hover:text-foreground hover:border-primary/50 transition cursor-pointer shadow-xs group"
            title="Gelecek 6 ayın taksit projeksiyonuna kaydır"
          >
            <span>🔮</span>
            <span>Gelecek Ayları Gör</span>
            <span className="text-[11px] text-muted group-hover:translate-y-0.5 transition-transform">
              ↓
            </span>
          </button>

          {/* Akordiyon: Tüm Kartları Kapat / Aç */}
          {kartlar.length > 0 && (
            <button
              type="button"
              onClick={toggleAllCollapse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-surface-raised border border-border/70 text-xs font-bold text-muted hover:text-foreground hover:border-primary/50 transition cursor-pointer shadow-xs"
              title={
                collapsedKartIds.length === kartlar.length
                  ? "Tüm kartları aç"
                  : "Tüm kartları daralt/kapat"
              }
            >
              <span>{collapsedKartIds.length === kartlar.length ? "📂" : "📁"}</span>
              <span>
                {collapsedKartIds.length === kartlar.length
                  ? "Kartları Aç"
                  : "Kartları Kapat"}
              </span>
            </button>
          )}
        </div>

        {/* Yeni Ekle Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAktarimModalOpen(true)}
            className="secondary-button h-10 px-3.5 text-xs font-bold border-primary/40 text-primary hover:bg-primary/10 transition"
            title="Taksitleri Aylık Bütçe & Ev Giderleri sekmesine aktar"
          >
            <span>📥</span>
            <span>Bütçeye Yansıt</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddKart}
            className="secondary-button h-10 px-3.5 text-xs font-bold"
            title="Yeni kredi kartı ekle"
          >
            <span>💳</span>
            <span>Yeni Kart Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddTaksit()}
            className="primary-button h-10 px-4 text-xs font-bold shadow-sm"
          >
            <span>➕</span>
            <span>Taksit Ekle</span>
          </button>
        </div>
      </div>

      {/* Aktarım Bildirimi */}
      {aktarimMesaj && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="font-bold text-foreground">{aktarimMesaj}</span>
          </div>
          <button
            type="button"
            onClick={() => setAktarimMesaj(null)}
            className="text-muted hover:text-foreground font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kart Grupları Listesi (Cards Grouped List) */}
      {kartlar.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-surface/50 space-y-3">
          <span className="text-4xl block">💳</span>
          <h3 className="text-lg font-bold text-foreground">
            Henüz Kredi Kartı Tanımlanmamış
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Taksitlerinizi kartlarınıza göre gruplamak ve ekstre tarihlerine göre son ödeme günlerini otomatik hesaplamak için önce bir kart tanımlayın.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenAddKart}
              className="primary-button px-5 py-2.5 text-xs font-bold"
            >
              <span>💳</span> İlk Kartı Tanımla
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedKartlar.map((kart, index) => {
            const buKartaAitTaksitler = filteredTaksitler.filter((t) => t.kartId === kart.id);
            return (
              <TaksitKartGrubu
                key={kart.id}
                kart={kart}
                taksitler={buKartaAitTaksitler}
                isTopCard={index === 0 && buKartaAitTaksitler.length > 0}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onEditTaksit={handleOpenEditTaksit}
                onDeleteTaksit={handleDeleteTaksit}
                onAddTaksitToKart={handleOpenAddTaksit}
                onEditKart={handleOpenEditKart}
                onDeleteKart={handleDeleteKart}
                onPayAllForKart={handlePayAllForKart}
                onToggleAktif={handleToggleKartAktif}
                isCollapsed={collapsedKartIds.includes(kart.id)}
                onToggleCollapse={toggleKartCollapse}
              />
            );
          })}
        </div>
      )}

      {/* 🔮 Gelecek 6 Ayın Taksit Projeksiyonu (En Altta) */}
      <div ref={projeksiyonRef} className="scroll-mt-6">
        <TaksitProjeksiyonu taksitler={taksitler} kartlar={kartlar} />
      </div>

      {/* Taksit Modal */}
      <TaksitModal
        isOpen={isTaksitModalOpen}
        onClose={() => setIsTaksitModalOpen(false)}
        onSave={handleSaveTaksit}
        kartlar={kartlar}
        editingTaksit={editingTaksit}
        defaultKartId={targetKartId}
      />

      {/* Kart Modal */}
      <KartModal
        isOpen={isKartModalOpen}
        onClose={() => setIsKartModalOpen(false)}
        onSave={handleSaveKart}
        editingKart={editingKart}
      />

      {/* Taksit Aktarım Modalı */}
      <TaksitAktarimModal
        isOpen={isAktarimModalOpen}
        onClose={() => setIsAktarimModalOpen(false)}
        kartlar={kartlar}
        taksitler={taksitler}
        onSuccess={(msg) => setAktarimMesaj(msg)}
      />
    </div>
  );
}
