"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/Icons";
import type { TaksitKarti, TaksitKalemi } from "@/domain/taksitTypes";
import {
  ayAnahtariOlustur,
  ayAnahtariParcala,
  taksitleriAyaAktar,
  ayVerisiTaksitYedegiVarMi,
  ayVerisiTaksitYedegindenGeriAl,
} from "@/storage/ayDeposu";

interface TaksitAktarimModalProps {
  isOpen: boolean;
  onClose: () => void;
  kartlar: TaksitKarti[];
  taksitler: TaksitKalemi[];
  onSuccess?: (mesaj: string) => void;
  initialKartId?: string | null;
}

const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
] as const;

const paraFormat = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

export function TaksitAktarimModal({
  isOpen,
  onClose,
  kartlar,
  taksitler,
  onSuccess,
  initialKartId,
}: TaksitAktarimModalProps) {
  const [mounted, setMounted] = useState(false);

  // Varsayılan hedef ay: Bu ay
  const d = new Date();
  const simdikiAy = ayAnahtariOlustur(d.getFullYear(), d.getMonth());
  const gelecekAy = ayAnahtariOlustur(d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear(), (d.getMonth() + 1) % 12);

  const [hedefAy, setHedefAy] = useState(simdikiAy);
  const [aktarimModu, setAktarimModu] = useState<"birlestir" | "arti_bir">("birlestir");
  const [seciliKartId, setSeciliKartId] = useState<string>("tum");
  const [isDone, setIsDone] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsDone(false);
      setSeciliKartId(initialKartId || "tum");
    }
  }, [isOpen, initialKartId]);

  useEffect(() => {
    if (isOpen) {
      setHasBackup(ayVerisiTaksitYedegiVarMi(hedefAy));
    }
  }, [isOpen, hedefAy]);

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

  // Aktarılacak aktif kartlar ve taksit detayları
  const previewData = useMemo(() => {
    const aktifKartlar = kartlar
      .filter((k) => k.aktif !== false)
      .filter((k) => (seciliKartId === "tum" ? true : k.id === seciliKartId));
    const isArtiBir = aktarimModu === "arti_bir";

    const kartDetaylari = aktifKartlar
      .map((k) => {
        const buKartTaksitleri = taksitler.filter((t) => {
          if (t.kartId !== k.id) return false;
          if (isArtiBir) {
            return t.toplamTaksit - t.odenenTaksit > 1;
          }
          return t.odenenTaksit < t.toplamTaksit;
        });

        const toplam = buKartTaksitleri.reduce((s, t) => s + t.aylikTutar, 0);
        const mertBireysel = buKartTaksitleri
          .filter((t) => t.sahip === "mert")
          .reduce((s, t) => s + t.aylikTutar, 0);
        const havsaBireysel = buKartTaksitleri
          .filter((t) => t.sahip === "havsa")
          .reduce((s, t) => s + t.aylikTutar, 0);
        const ortak = buKartTaksitleri
          .filter((t) => t.sahip === "ortak")
          .reduce((s, t) => s + t.aylikTutar, 0);

        return {
          kart: k,
          taksitler: buKartTaksitleri,
          toplam,
          mertBireysel,
          havsaBireysel,
          ortak,
        };
      })
      .filter((item) => item.taksitler.length > 0);

    const toplamAylik = kartDetaylari.reduce((s, k) => s + k.toplam, 0);
    const toplamMertBireysel = kartDetaylari.reduce((s, k) => s + k.mertBireysel, 0);
    const toplamHavsaBireysel = kartDetaylari.reduce((s, k) => s + k.havsaBireysel, 0);
    const toplamOrtak = kartDetaylari.reduce((s, k) => s + k.ortak, 0);
    const mertToplamPay = toplamMertBireysel + toplamOrtak / 2;
    const havsaToplamPay = toplamHavsaBireysel + toplamOrtak / 2;

    return {
      kartDetaylari,
      toplamAylik,
      toplamMertBireysel,
      toplamHavsaBireysel,
      toplamOrtak,
      mertToplamPay,
      havsaToplamPay,
    };
  }, [kartlar, taksitler, aktarimModu, seciliKartId]);

  if (!mounted || !isOpen) return null;

  const formatAyLabel = (anahtar: string) => {
    const { yil, ay } = ayAnahtariParcala(anahtar);
    return `${AYLAR[ay]} ${yil}`;
  };

  const handleAktar = () => {
    const aktarilacakKartlar =
      seciliKartId === "tum"
        ? kartlar
        : kartlar.filter((k) => k.id === seciliKartId);

    const res = taksitleriAyaAktar(hedefAy, aktarilacakKartlar, taksitler, aktarimModu);
    setIsDone(true);
    setHasBackup(true);
    if (onSuccess) {
      const ekMesaj = aktarimModu === "arti_bir" ? " (+1 artırılmış olarak)" : "";
      const kartBilgisi =
        seciliKartId === "tum"
          ? `${res.aktarilanKartSayisi} kart`
          : `"${aktarilacakKartlar[0]?.ad}" kartı`;
      onSuccess(
        `Taksitler ${formatAyLabel(hedefAy)} bütçesine başarıyla aktarıldı${ekMesaj} (${kartBilgisi}, toplam ${paraFormat(res.toplamTutar)})`
      );
    }
  };

  const handleGeriAl = () => {
    const basarili = ayVerisiTaksitYedegindenGeriAl(hedefAy);
    if (basarili) {
      setHasBackup(false);
      setIsDone(false);
      if (onSuccess) {
        onSuccess(`${formatAyLabel(hedefAy)} bütçesindeki son taksit aktarımı geri alındı.`);
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-surface shadow-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-lg">
              📥
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {seciliKartId !== "tum"
                  ? `"${kartlar.find((k) => k.id === seciliKartId)?.ad || "Kart"}" Taksit Aktarımı`
                  : "Ev Giderlerine Taksit Aktarımı"}
              </h2>
              <p className="text-xs text-muted">
                {seciliKartId !== "tum"
                  ? "Yalnızca bu kartın taksitlerini seçili ayın gider tablosuna yansıtın"
                  : "Tüm aktif kartlardaki taksitleri Aylık Bütçe tablosuna yansıtın"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Kapat"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Başarı Bildirimi */}
          {isDone && (
            <div className="p-4 rounded-xl bg-success-soft border border-success/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">✅</span>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Taksitler {formatAyLabel(hedefAy)} Tablosuna Aktarıldı!
                  </span>
                  <span className="text-[11px] text-foreground-secondary block">
                    Ev Giderleri sekmesinde ekstreleri ve kişi paylarını görüntüleyebilirsiniz.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGeriAl}
                className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-warning hover:bg-surface-raised transition cursor-pointer shrink-0"
              >
                ↩️ Geri Al
              </button>
            </div>
          )}

          {/* Geri Alınabilir Yedek Uyarısı */}
          {!isDone && hasBackup && (
            <div className="p-3.5 rounded-xl bg-warning-soft border border-warning/25 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span>ℹ️</span>
                <span className="text-foreground-secondary">
                  Bu ay için önceden aktarılmış bir taksit yedeği bulunuyor.
                </span>
              </div>
              <button
                type="button"
                onClick={handleGeriAl}
                className="px-2.5 py-1 rounded-lg bg-surface border border-border font-bold text-warning hover:bg-surface-raised transition cursor-pointer shrink-0"
              >
                Son Aktarımı Geri Al
              </button>
            </div>
          )}

          {/* 1. Aktarılacak Kart Kapsamı (Toplu mu, Tek Kart mı?) */}
          <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground block">
                1. Hangi Kartlar Aktarılsın?
              </label>
              {seciliKartId !== "tum" && (
                <button
                  type="button"
                  onClick={() => setSeciliKartId("tum")}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Tüm Kartlara Geç (Toplu)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeciliKartId("tum")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-between ${
                  seciliKartId === "tum"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface border-border text-foreground hover:bg-background-subtle"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>💳</span>
                  <span>Tüm Aktif Kartlar (Toplu)</span>
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    seciliKartId === "tum" ? "bg-white/20 text-white" : "bg-surface-raised text-muted"
                  }`}
                >
                  {kartlar.filter((k) => k.aktif !== false).length} Kart
                </span>
              </button>

              {kartlar
                .filter((k) => k.aktif !== false)
                .map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setSeciliKartId(k.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-between truncate ${
                      seciliKartId === k.id
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface border-border text-foreground hover:bg-background-subtle"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>💳</span>
                      <span className="truncate">{k.ad}</span>
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-mono ${
                        seciliKartId === k.id ? "bg-white/20 text-white" : "bg-surface-raised text-muted"
                      }`}
                    >
                      {k.kartSahibi.toUpperCase()}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* 2. Hedef Ay Seçimi */}
          <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2.5">
            <label className="text-xs font-bold text-foreground block">
              2. Hangi Ayın Gider Tablosuna Aktarılsın?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHedefAy(simdikiAy)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                  hedefAy === simdikiAy
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface border-border text-foreground hover:bg-background-subtle"
                }`}
              >
                <span>📅 Bu Ay ({formatAyLabel(simdikiAy)})</span>
              </button>
              <button
                type="button"
                onClick={() => setHedefAy(gelecekAy)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                  hedefAy === gelecekAy
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface border-border text-foreground hover:bg-background-subtle"
                }`}
              >
                <span>🔜 Gelecek Ay ({formatAyLabel(gelecekAy)})</span>
              </button>
            </div>
          </div>

          {/* 3. Aktarım Modu Seçimi */}
          <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2.5">
            <label className="text-xs font-bold text-foreground block">
              3. Aktarım Şekli
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setAktarimModu("birlestir")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  aktarimModu === "birlestir"
                    ? "bg-surface border-primary ring-1 ring-primary/30"
                    : "bg-surface border-border hover:bg-background-subtle"
                }`}
              >
                <input
                  type="radio"
                  name="aktarimModu"
                  checked={aktarimModu === "birlestir"}
                  onChange={() => setAktarimModu("birlestir")}
                  className="mt-0.5 accent-primary cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span>Mevcut Kartlarla Eşleştir & Güncelle</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-bold uppercase">
                      Önerilen
                    </span>
                  </span>
                  <span className="text-muted block mt-0.5 text-[11px]">
                    Ev Giderlerindeki Garanti, Yapı Kredi vb. kartlarla eşleşir; bireysel taksitleri kartın içine bireysel harcama olarak yazar.
                  </span>
                </div>
              </label>

              <label
                onClick={() => {
                  setAktarimModu("arti_bir");
                  setHedefAy(gelecekAy);
                }}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  aktarimModu === "arti_bir"
                    ? "bg-surface border-primary ring-1 ring-primary/30"
                    : "bg-surface border-border hover:bg-background-subtle"
                }`}
              >
                <input
                  type="radio"
                  name="aktarimModu"
                  checked={aktarimModu === "arti_bir"}
                  onChange={() => {
                    setAktarimModu("arti_bir");
                    setHedefAy(gelecekAy);
                  }}
                  className="mt-0.5 accent-primary cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span>Taksitleri +1 Arttırarak Ekle</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-lavender text-primary font-bold uppercase border border-border-lavender">
                      Gelecek Ay İçin
                    </span>
                  </span>
                  <span className="text-muted block mt-0.5 text-[11px]">
                    Taksit sayaçlarını ana sayfada değiştirmeden, hedef aya taksitlerin sonraki ayki değerini (örn: 2/6 yerine 3/6) aktarır. Bu ay biten taksitler dahil edilmez.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Aktarılacak Kartlar ve Tutar Önizlemesi */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground block">
              4. Aktarılacak Taksitler ve Kişi Payları
            </span>

            {previewData.kartDetaylari.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-surface border border-dashed border-border text-muted text-xs">
                Seçilen kriterlere uygun aktarılacak taksit bulunamadı.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {previewData.kartDetaylari.map(({ kart, toplam, mertBireysel, havsaBireysel, ortak }) => (
                  <div
                    key={kart.id}
                    className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">
                        💳 {kart.ad}
                      </span>
                      <span className="text-[11px] text-muted block mt-0.5 tabular-nums">
                        Mert: {paraFormat(mertBireysel)} • Havsa: {paraFormat(havsaBireysel)} • Ortak: {paraFormat(ortak)}
                      </span>
                    </div>
                    <span className="font-bold text-foreground text-sm tabular-nums">
                      {paraFormat(toplam)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Toplam Bütçe Yansıması */}
            {previewData.kartDetaylari.length > 0 && (
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-xs space-y-1.5">
                <div className="flex items-center justify-between text-muted">
                  <span>Toplam Ev Gideri:</span>
                  <span className="font-bold text-foreground tabular-nums">{paraFormat(previewData.toplamAylik)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Mert'in Bütçesine Yansıyacak Borç:</span>
                  <span className="font-bold text-primary tabular-nums">{paraFormat(previewData.mertToplamPay)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Havsa'nın Bütçesine Yansıyacak Borç:</span>
                  <span className="font-bold text-primary tabular-nums">{paraFormat(previewData.havsaToplamPay)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 bg-surface shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button px-4 text-xs font-semibold"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleAktar}
            disabled={previewData.kartDetaylari.length === 0}
            className="primary-button px-5 py-2.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>📥</span>
            <span>
              {seciliKartId === "tum"
                ? `${formatAyLabel(hedefAy)} Bütçesine ${aktarimModu === "arti_bir" ? "+1 Artırarak " : ""}Toplu Aktar`
                : `"${previewData.kartDetaylari[0]?.kart.ad || "Kartı"}" ${formatAyLabel(hedefAy)} Bütçesine Aktar`}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
