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
  hesaplaTaksitVadesi,
  hesaplaKartSonOdemeDurumu,
  TAKSiT_UPDATED_EVENT,
} from "@/storage/taksitStorage";
import { TaksitModal } from "../taksit/TaksitModal";
import { KartModal } from "../taksit/KartModal";
import { TaksitAktarimModal } from "../taksit/TaksitAktarimModal";
import { TaksitProjeksiyonu } from "../taksit/TaksitProjeksiyonu";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  ChevronDownIcon,
} from "@/components/ui/Icons";

const paraFormat = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

type TaksitViewMode = "taksit_taksit" | "kart_kart";

export function TaksitSimpleView() {
  const [kartlar, setKartlar] = useState<TaksitKarti[]>([]);
  const [taksitler, setTaksitler] = useState<TaksitKalemi[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Görünüm Modu: Taksit Taksit Gör vs Kart Kart Gör
  const [viewMode, setViewMode] = useState<TaksitViewMode>("kart_kart");
  const [expandedKartId, setExpandedKartId] = useState<string | null>(null);

  // Sade Filtreler
  const [filterSahip, setFilterSahip] = useState<"tum" | TaksitSahibi>("tum");
  const [filterKartId, setFilterKartId] = useState<string>("tum");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showProjeksiyon, setShowProjeksiyon] = useState(false);

  // Onay State'leri
  const [confirmDeleteTaksitId, setConfirmDeleteTaksitId] = useState<string | null>(null);
  const [confirmDeleteKartId, setConfirmDeleteKartId] = useState<string | null>(null);
  const [confirmPayAllKartId, setConfirmPayAllKartId] = useState<string | null>(null);

  // Modallar
  const [isTaksitModalOpen, setIsTaksitModalOpen] = useState(false);
  const [editingTaksit, setEditingTaksit] = useState<TaksitKalemi | null>(null);
  const [targetKartId, setTargetKartId] = useState<string | undefined>(undefined);

  const [isKartModalOpen, setIsKartModalOpen] = useState(false);
  const [editingKart, setEditingKart] = useState<TaksitKarti | null>(null);

  const [isAktarimModalOpen, setIsAktarimModalOpen] = useState(false);
  const [aktarimKartId, setAktarimKartId] = useState<string | null>(null);
  const [toastMesaj, setToastMesaj] = useState<string | null>(null);

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
    const aktifKartIdSet = new Set(
      kartlar.filter((k) => k.aktif !== false).map((k) => k.id)
    );
    const dahilOlanlar = taksitler.filter((t) => aktifKartIdSet.has(t.kartId));
    const aktifler = dahilOlanlar.filter((t) => t.odenenTaksit < t.toplamTaksit);

    const toplamAylik = aktifler.reduce((s, t) => s + t.aylikTutar, 0);
    const mertBireysel = aktifler
      .filter((t) => t.sahip === "mert")
      .reduce((s, t) => s + t.aylikTutar, 0);
    const havsaBireysel = aktifler
      .filter((t) => t.sahip === "havsa")
      .reduce((s, t) => s + t.aylikTutar, 0);
    const ortakAylik = aktifler
      .filter((t) => t.sahip === "ortak")
      .reduce((s, t) => s + t.aylikTutar, 0);

    const ortakYari = Math.round((ortakAylik / 2) * 100) / 100;
    const mertToplamPay = mertBireysel + ortakYari;
    const havsaToplamPay = havsaBireysel + ortakYari;

    const toplamKalanBorc = aktifler.reduce(
      (s, t) => s + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar,
      0
    );

    return {
      toplamAylik,
      mertToplamPay,
      havsaToplamPay,
      ortakAylik,
      toplamKalanBorc,
      aktifSayisi: aktifler.length,
      bitenSayisi: dahilOlanlar.length - aktifler.length,
    };
  }, [kartlar, taksitler]);

  // Filtrelenmiş Taksitler
  const filtrelenmisTaksitler = useMemo(() => {
    return taksitler.filter((t) => {
      if (viewMode === "taksit_taksit" && filterKartId !== "tum" && t.kartId !== filterKartId) {
        return false;
      }
      if (filterSahip !== "tum" && t.sahip !== filterSahip) return false;
      const bitti = t.odenenTaksit >= t.toplamTaksit;
      if (!showCompleted && bitti) return false;
      return true;
    });
  }, [taksitler, viewMode, filterKartId, filterSahip, showCompleted]);

  // Kartları en çok taksiti olandan aza doğru sırala
  const siraliKartlar = useMemo(() => {
    return [...kartlar].sort((a, b) => {
      const aCount = filtrelenmisTaksitler.filter((t) => t.kartId === a.id).length;
      const bCount = filtrelenmisTaksitler.filter((t) => t.kartId === b.id).length;
      if (bCount !== aCount) return bCount - aCount;
      return 0;
    });
  }, [kartlar, filtrelenmisTaksitler]);

  // Eylemler
  const handleSaveTaksit = (input: Omit<TaksitKalemi, "id" | "createdAt">) => {
    if (editingTaksit) {
      updateTaksit(editingTaksit.id, input);
    } else {
      addTaksit(input);
    }
    refreshData();
  };

  const handleSaveKart = (input: Omit<TaksitKarti, "id" | "createdAt">) => {
    if (editingKart) {
      updateTaksitKarti(editingKart.id, input);
    } else {
      addTaksitKarti(input);
    }
    refreshData();
  };

  const renderTaksitRow = (taksit: TaksitKalemi, showKartBadge: boolean) => {
    const kart = kartlar.find((k) => k.id === taksit.kartId);
    const vade = hesaplaTaksitVadesi(kart, taksit);
    const yuzde = Math.min(
      100,
      Math.round((taksit.odenenTaksit / taksit.toplamTaksit) * 100)
    );

    return (
      <div
        key={taksit.id}
        className={`p-3.5 sm:p-4 rounded-xl border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
          vade.tamamlandi
            ? "opacity-60 bg-surface-raised/50 border-border"
            : "border-border hover:border-border-strong"
        }`}
      >
        {/* Sol: Ürün Adı, Kartı ve İlerleme Çubuğu */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground truncate">
              {taksit.urunAdi}
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                taksit.sahip === "ortak"
                  ? "bg-surface-lavender text-primary border-border-lavender"
                  : taksit.sahip === "mert"
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
                  : "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25"
              }`}
            >
              {taksit.sahip === "ortak"
                ? "👥 Ortak"
                : taksit.sahip === "mert"
                ? "👤 Mert"
                : "👤 Havsa"}
            </span>

            {showKartBadge && kart && (
              <span className="ds-badge ds-badge-neutral text-[10px]">
                💳 {kart.ad}
              </span>
            )}

            {vade.tamamlandi ? (
              <span className="ds-badge ds-badge-success text-[10px]">✓ Bitti</span>
            ) : (
              <span className="text-[11px] font-semibold text-muted">
                Kalan: <strong className="text-foreground">{vade.kalanTaksit} ay</strong> ({paraFormat(vade.kalanTutar)})
              </span>
            )}
          </div>

          {/* İnce İlerleme Barı */}
          <div className="flex items-center gap-2.5 max-w-md">
            <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  vade.tamamlandi ? "bg-success" : "bg-primary"
                }`}
                style={{ width: `${yuzde}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted tabular-nums">
              %{yuzde}
            </span>
          </div>
        </div>

        {/* Sağ: Aylık Tutar, Sayaç (- / +1) ve Düzenle/Sil */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0">
          <div className="text-left sm:text-right">
            <span className="text-sm sm:text-base font-extrabold text-foreground tabular-nums block">
              {paraFormat(taksit.aylikTutar)}
              <span className="text-[10px] font-normal text-muted"> /ay</span>
            </span>
            <span className="text-[10px] text-muted tabular-nums block">
              Toplam: {paraFormat(taksit.toplamTutar)}
            </span>
          </div>

          {/* Kompakt Taksit Sayacı */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-border">
            <button
              type="button"
              disabled={taksit.odenenTaksit <= 0}
              onClick={() => {
                decrementTaksit(taksit.id);
                refreshData();
              }}
              className="h-7 w-7 rounded-lg bg-surface border border-border text-xs font-bold flex items-center justify-center hover:bg-background-subtle disabled:opacity-30 cursor-pointer"
              title="1 taksit geri al"
            >
              −
            </button>
            <span className="px-2 text-xs font-bold text-foreground tabular-nums">
              {taksit.odenenTaksit}/{taksit.toplamTaksit}
            </span>
            <button
              type="button"
              disabled={taksit.odenenTaksit >= taksit.toplamTaksit}
              onClick={() => {
                incrementTaksit(taksit.id);
                refreshData();
              }}
              className="h-7 px-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover disabled:opacity-30 cursor-pointer"
              title="1 taksit ödendi işaretle"
            >
              +1
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditingTaksit(taksit);
                setTargetKartId(taksit.kartId);
                setIsTaksitModalOpen(true);
              }}
              className="icon-button h-8 w-8"
              title="Düzenle"
            >
              <EditIcon className="w-3.5 h-3.5" />
            </button>

            {confirmDeleteTaksitId === taksit.id ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    deleteTaksit(taksit.id);
                    setConfirmDeleteTaksitId(null);
                    refreshData();
                  }}
                  className="danger-button h-8 px-2 text-xs"
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTaksitId(null)}
                  className="secondary-button h-8 px-2 text-xs"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteTaksitId(taksit.id)}
                className="icon-button h-8 w-8 hover:text-danger"
                title="Sil"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface-raised border border-border" />;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast */}
      {toastMesaj && (
        <div className="p-3.5 rounded-2xl bg-success-bg border border-success-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span>✅</span>
            <span>{toastMesaj}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMesaj(null)}
            className="icon-button h-7 w-7"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. ÜST ÖZET KARTLARI (SADE 4'LÜ KUTU) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="ds-card p-4 border-l-4 border-l-primary">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Aylık Taksit Yükü
          </span>
          <span className="text-xl font-extrabold text-foreground tabular-nums block my-1">
            {paraFormat(stats.toplamAylik)}
          </span>
          <span className="text-[11px] text-muted">
            {stats.aktifSayisi} aktif taksit • Ortak: {paraFormat(stats.ortakAylik)}
          </span>
        </div>

        <div className="ds-card p-4 border-l-4 border-l-sky-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
            👤 Mert Aylık Pay
          </span>
          <span className="text-xl font-extrabold text-foreground tabular-nums block my-1">
            {paraFormat(stats.mertToplamPay)}
          </span>
          <span className="text-[11px] text-muted">Şahsi + Ortak (%50)</span>
        </div>

        <div className="ds-card p-4 border-l-4 border-l-pink-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 block">
            👤 Havsa Aylık Pay
          </span>
          <span className="text-xl font-extrabold text-foreground tabular-nums block my-1">
            {paraFormat(stats.havsaToplamPay)}
          </span>
          <span className="text-[11px] text-muted">Şahsi + Ortak (%50)</span>
        </div>

        <div className="ds-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            ⏳ Kalan Toplam Borç
          </span>
          <span className="text-xl font-extrabold text-foreground tabular-nums block my-1">
            {paraFormat(stats.toplamKalanBorc)}
          </span>
          <span className="text-[11px] text-muted">Tüm vadeler toplamı</span>
        </div>
      </div>

      {/* 2. KONTROL & GÖRÜNÜM ÇUBUĞU */}
      <div className="ds-card p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Sol: Görünüm Modu (Kart Kart vs Taksit Taksit) + Kişi Filtresi */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Görünüm Seçici */}
          <div className="flex items-center p-1 rounded-xl bg-surface-raised border border-border">
            <button
              type="button"
              onClick={() => setViewMode("kart_kart")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "kart_kart"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>💳</span>
              <span>Kart Kart Gör ({kartlar.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("taksit_taksit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "taksit_taksit"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>🏷️</span>
              <span>Taksit Taksit Gör ({filtrelenmisTaksitler.length})</span>
            </button>
          </div>

          {/* Kişi Filtresi */}
          <div className="flex items-center p-1 rounded-xl bg-surface-raised border border-border">
            {(["tum", "ortak", "mert", "havsa"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterSahip(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterSahip === s
                    ? "bg-surface text-foreground shadow-2xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {s === "tum"
                  ? "Tümü"
                  : s === "ortak"
                  ? "👥 Ortak"
                  : s === "mert"
                  ? "👤 Mert"
                  : "👤 Havsa"}
              </button>
            ))}
          </div>

          {/* Taksit Taksit modundaysa Kart Filtresi */}
          {viewMode === "taksit_taksit" && kartlar.length > 1 && (
            <select
              value={filterKartId}
              onChange={(e) => setFilterKartId(e.target.value)}
              className="field h-9 w-auto py-1 px-3 text-xs font-semibold"
            >
              <option value="tum">💳 Tüm Kartlar</option>
              {kartlar.map((k) => (
                <option key={k.id} value={k.id}>
                  💳 {k.ad}
                </option>
              ))}
            </select>
          )}

          {stats.bitenSayisi > 0 && (
            <label className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground cursor-pointer select-none px-2">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-border accent-primary cursor-pointer"
              />
              <span>Bitenleri Göster ({stats.bitenSayisi})</span>
            </label>
          )}
        </div>

        {/* Sağ: Hızlı Aksiyonlar */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setShowProjeksiyon((v) => !v)}
            className="secondary-button h-9 px-3 text-xs font-semibold"
          >
            <span>🔮</span>
            <span>6 Aylık Plan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAktarimKartId(null);
              setIsAktarimModalOpen(true);
            }}
            className="accent-button h-9 px-3 text-xs font-semibold"
          >
            <span>📥</span>
            <span>Bütçeye Yansıt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingKart(null);
              setIsKartModalOpen(true);
            }}
            className="secondary-button h-9 px-3 text-xs font-semibold"
          >
            <span>💳</span>
            <span>Yeni Kart</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTaksit(null);
              setTargetKartId(
                viewMode === "kart_kart" && expandedKartId
                  ? expandedKartId
                  : filterKartId !== "tum"
                  ? filterKartId
                  : undefined
              );
              setIsTaksitModalOpen(true);
            }}
            className="primary-button h-9 px-3.5 text-xs font-semibold"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Taksit Ekle</span>
          </button>
        </div>
      </div>

      {/* 3. 6 AYLIK PROJEKSİYON ÇEKMECESİ (İSTEĞE BAĞLI AÇILIR) */}
      {showProjeksiyon && (
        <div className="animate-in fade-in duration-150">
          <TaksitProjeksiyonu taksitler={taksitler} kartlar={kartlar} />
        </div>
      )}

      {/* 4. MOD A: KART KART GÖR (KART SEÇİNCE TAKSİTLER ALTINDA AÇILIR) */}
      {viewMode === "kart_kart" && (
        <div className="space-y-2.5">
          {siraliKartlar.length === 0 ? (
            <div className="ds-card p-10 text-center space-y-3 border-dashed">
              <span className="text-3xl block">💳</span>
              <h4 className="text-sm font-bold text-foreground">Henüz Kredi Kartı Tanımlanmamış</h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Taksitlerinizi kartlara göre gruplamak için önce bir kredi kartı ekleyin.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingKart(null);
                  setIsKartModalOpen(true);
                }}
                className="primary-button h-9 px-4 text-xs"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>İlk Kartı Ekle</span>
              </button>
            </div>
          ) : (
            siraliKartlar.map((kart) => {
              const isExpanded = expandedKartId === kart.id;
              const sonOdeme = hesaplaKartSonOdemeDurumu(kart);
              const buKartaAitTaksitler = filtrelenmisTaksitler.filter(
                (t) => t.kartId === kart.id
              );
              const aktifTaksitler = buKartaAitTaksitler.filter(
                (t) => t.odenenTaksit < t.toplamTaksit
              );
              const kartAylik = aktifTaksitler.reduce((s, t) => s + t.aylikTutar, 0);
              const kartKalanBorc = aktifTaksitler.reduce(
                (s, t) => s + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar,
                0
              );

              return (
                <div
                  key={kart.id}
                  className={`ds-card p-0 overflow-hidden transition-all ${
                    kart.aktif === false ? "opacity-60" : ""
                  } ${isExpanded ? "border-primary/50 ring-1 ring-primary/15" : ""}`}
                >
                  {/* Kart Ana Satırı (Tıklanınca Taksitleri Altında Açar) */}
                  <div
                    onClick={() => setExpandedKartId(isExpanded ? null : kart.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-surface-raised/60 transition select-none"
                  >
                    {/* Sol: Kart İkonu, Adı ve Detayları */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-lg shrink-0">
                        💳
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">
                            {kart.ad}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              kart.kartSahibi === "mert"
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
                                : kart.kartSahibi === "havsa"
                                ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25"
                                : "bg-surface-lavender text-primary border-border-lavender"
                            }`}
                          >
                            {kart.kartSahibi === "mert"
                              ? "👤 Mert"
                              : kart.kartSahibi === "havsa"
                              ? "👤 Havsa"
                              : "👥 Ortak"}
                          </span>

                          <span className="ds-badge ds-badge-neutral text-[10px]">
                            🏷️ {buKartaAitTaksitler.length} taksit
                          </span>

                          {aktifTaksitler.length > 0 && sonOdeme.kalanGun <= 5 && (
                            <span className="ds-badge ds-badge-warning text-[10px]">
                              ⏰ Son ödeme: {sonOdeme.kalanGun === 0 ? "Bugün!" : `${sonOdeme.kalanGun} gün`}
                            </span>
                          )}

                          {kart.aktif === false && (
                            <span className="ds-badge ds-badge-danger text-[10px]">
                              Hesap Dışı
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted mt-1 flex-wrap">
                          <span>Kesim: Ayın {kart.ekstreGunu}&apos;i</span>
                          <span>•</span>
                          <span>Son Ödeme: {sonOdeme.tarihStr}</span>
                          <span>•</span>
                          <span>
                            Kalan Borç:{" "}
                            <strong className="text-foreground tabular-nums">
                              {paraFormat(kartKalanBorc)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ: Kartın Aylık Taksit Toplamı & Hızlı Butonlar */}
                    <div
                      className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-left sm:text-right">
                        <span className="text-base sm:text-lg font-extrabold text-foreground tabular-nums block">
                          {paraFormat(kartAylik)}
                          <span className="text-[10px] font-normal text-muted"> /ay</span>
                        </span>
                        <span className="text-[10px] text-muted block">
                          Aylık Taksit Toplamı
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaksit(null);
                            setTargetKartId(kart.id);
                            setIsTaksitModalOpen(true);
                          }}
                          className="secondary-button h-8 px-2.5 text-xs"
                          title="Bu karta yeni taksit ekle"
                        >
                          + Taksit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingKart(kart);
                            setIsKartModalOpen(true);
                          }}
                          className="icon-button h-8 w-8"
                          title="Kartı düzenle"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteKartId === kart.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                deleteTaksitKarti(kart.id);
                                setConfirmDeleteKartId(null);
                                refreshData();
                              }}
                              className="danger-button h-8 px-2.5 text-xs"
                            >
                              Sil
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKartId(null)}
                              className="secondary-button h-8 px-2 text-xs"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKartId(kart.id)}
                            className="icon-button h-8 w-8 hover:text-danger"
                            title="Kartı sil"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedKartId(isExpanded ? null : kart.id)}
                          className="icon-button h-8 w-8"
                          title={isExpanded ? "Taksitleri gizle" : "Taksitleri göster"}
                        >
                          <ChevronDownIcon
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Açılır Alan: Bu Karta Ait Taksitler ve Kart Aksiyonları */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2.5 border-t border-border bg-surface-raised/40 space-y-3 animate-in fade-in duration-150">
                      {/* Kart Alt İşlem Çubuğu */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-xs">
                        <span className="font-bold text-foreground-secondary">
                          🏷️ {kart.ad} Taksitleri ({buKartaAitTaksitler.length})
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {confirmPayAllKartId === kart.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  incrementAllTaksitlerForKart(kart.id);
                                  setConfirmPayAllKartId(null);
                                  refreshData();
                                }}
                                className="primary-button h-7 px-2.5 text-xs"
                              >
                                Onayla (+1 Ay İlerlet)
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmPayAllKartId(null)}
                                className="secondary-button h-7 px-2 text-xs"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={aktifTaksitler.length === 0}
                              onClick={() => setConfirmPayAllKartId(kart.id)}
                              className="secondary-button h-7 px-2.5 text-xs disabled:opacity-40"
                            >
                              <CheckIcon className="w-3 h-3 text-success" />
                              <span>Tümünü +1 Öde ({aktifTaksitler.length})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={aktifTaksitler.length === 0}
                            onClick={() => {
                              setAktarimKartId(kart.id);
                              setIsAktarimModalOpen(true);
                            }}
                            className="accent-button h-7 px-2.5 text-xs disabled:opacity-40"
                          >
                            📥 Bu Kartı Bütçeye Aktar
                          </button>
                        </div>
                      </div>

                      {/* Taksit Kalemleri */}
                      {buKartaAitTaksitler.length === 0 ? (
                        <div className="p-6 text-center rounded-xl border border-dashed border-border bg-surface text-xs text-muted space-y-2">
                          <p>Bu kartta henüz taksitli harcama bulunmuyor.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTaksit(null);
                              setTargetKartId(kart.id);
                              setIsTaksitModalOpen(true);
                            }}
                            className="primary-button h-8 px-3 text-xs"
                          >
                            + İlk Taksiti Ekle
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {buKartaAitTaksitler.map((taksit) =>
                            renderTaksitRow(taksit, false)
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. MOD B: TAKSİT TAKSİT GÖR (TÜM TAKSİTLER DÜZ LİSTEDE) */}
      {viewMode === "taksit_taksit" && (
        <div className="space-y-2">
          {filtrelenmisTaksitler.length === 0 ? (
            <div className="ds-card p-10 text-center space-y-3 border-dashed">
              <span className="text-3xl block">🏷️</span>
              <h4 className="text-sm font-bold text-foreground">Taksit Bulunamadı</h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Seçili filtrede devam eden bir taksit yok. Yeni bir taksitli alışveriş ekleyebilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingTaksit(null);
                  setIsTaksitModalOpen(true);
                }}
                className="primary-button h-9 px-4 text-xs"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Yeni Taksit Ekle</span>
              </button>
            </div>
          ) : (
            filtrelenmisTaksitler.map((taksit) => renderTaksitRow(taksit, true))
          )}
        </div>
      )}

      {/* Modallar */}
      <TaksitModal
        isOpen={isTaksitModalOpen}
        onClose={() => setIsTaksitModalOpen(false)}
        onSave={handleSaveTaksit}
        kartlar={kartlar}
        editingTaksit={editingTaksit}
        defaultKartId={targetKartId}
      />

      <KartModal
        isOpen={isKartModalOpen}
        onClose={() => setIsKartModalOpen(false)}
        onSave={handleSaveKart}
        editingKart={editingKart}
      />

      <TaksitAktarimModal
        isOpen={isAktarimModalOpen}
        onClose={() => {
          setIsAktarimModalOpen(false);
          setAktarimKartId(null);
        }}
        kartlar={kartlar}
        taksitler={taksitler}
        initialKartId={aktarimKartId}
        onSuccess={(msg) => setToastMesaj(msg)}
      />
    </div>
  );
}
