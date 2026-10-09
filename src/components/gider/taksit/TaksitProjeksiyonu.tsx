"use client";

import React, { useState, useMemo } from "react";
import type { TaksitKarti, TaksitKalemi } from "@/domain/taksitTypes";

interface TaksitProjeksiyonuProps {
  taksitler: TaksitKalemi[];
  kartlar: TaksitKarti[];
}

type GorunumModu = "toplam" | "mert" | "havsa";

const paraFormat = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);

interface AyProjeksiyonu {
  ayIndex: number; // 0 = Bu Dönem, 1 = Gelecek Dönem...
  ayAdi: string;
  yil: string;
  toplamTutar: number;
  mertPay: number;
  havsaPay: number;
  odenecekTaksitler: {
    urunAdi: string;
    aylikTutar: number;
    sahip: string;
    kacinciTaksit: number;
    toplamTaksit: number;
    buAyBitiyor: boolean;
  }[];
  bitenUrunler: string[];
}

export function TaksitProjeksiyonu({ taksitler, kartlar }: TaksitProjeksiyonuProps) {
  const [gorunum, setGorunum] = useState<GorunumModu>("toplam");
  const [seciliAyIndex, setSeciliAyIndex] = useState<number | null>(null);

  // Sadece aktif (hesaplara dahil) kartların taksitlerini al
  const aktifKartIdSet = useMemo(() => {
    return new Set(kartlar.filter((k) => k.aktif !== false).map((k) => k.id));
  }, [kartlar]);

  // Önümüzdeki 6 ayın projeksiyon verilerini hesapla
  const projeksiyonAylari: AyProjeksiyonu[] = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const dahilOlanTaksitler = taksitler.filter(
      (t) => aktifKartIdSet.has(t.kartId) && t.odenenTaksit < t.toplamTaksit
    );

    const aylar: AyProjeksiyonu[] = [];

    for (let offset = 0; offset < 6; offset++) {
      const targetDate1 = new Date(currentYear, currentMonth + offset, 1);
      const targetDate2 = new Date(currentYear, currentMonth + offset + 1, 1);

      const ay1 = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(targetDate1);
      const ay2 = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(targetDate2);

      const ayAdi1 = ay1.charAt(0).toUpperCase() + ay1.slice(1);
      const ayAdi2 = ay2.charAt(0).toUpperCase() + ay2.slice(1);

      // Ay sonunda maaş alındığı için "Ekim / Kasım" maaş dönemi formatı
      const ayDonemi = `${ayAdi1} / ${ayAdi2}`;
      const yil =
        targetDate1.getFullYear() === targetDate2.getFullYear()
          ? String(targetDate1.getFullYear())
          : `${targetDate1.getFullYear()}/${targetDate2.getFullYear()}`;

      let toplamTutar = 0;
      let mertBireysel = 0;
      let havsaBireysel = 0;
      let ortak = 0;

      const odenecekTaksitler: AyProjeksiyonu["odenecekTaksitler"] = [];
      const bitenUrunler: string[] = [];

      dahilOlanTaksitler.forEach((t) => {
        const kalanTaksit = t.toplamTaksit - t.odenenTaksit;
        // Eğer bu ay hala ödeniyorsa
        if (kalanTaksit > offset) {
          toplamTutar += t.aylikTutar;
          if (t.sahip === "mert") mertBireysel += t.aylikTutar;
          else if (t.sahip === "havsa") havsaBireysel += t.aylikTutar;
          else if (t.sahip === "ortak") ortak += t.aylikTutar;

          const buAyBitiyor = kalanTaksit === offset + 1;
          if (buAyBitiyor) {
            bitenUrunler.push(t.urunAdi);
          }

          odenecekTaksitler.push({
            urunAdi: t.urunAdi,
            aylikTutar: t.aylikTutar,
            sahip: t.sahip,
            kacinciTaksit: t.odenenTaksit + offset + 1,
            toplamTaksit: t.toplamTaksit,
            buAyBitiyor,
          });
        }
      });

      const ortakPay = Math.round((ortak / 2) * 100) / 100;
      const mertPay = mertBireysel + ortakPay;
      const havsaPay = havsaBireysel + ortakPay;

      aylar.push({
        ayIndex: offset,
        ayAdi: ayDonemi,
        yil,
        toplamTutar,
        mertPay,
        havsaPay,
        odenecekTaksitler,
        bitenUrunler,
      });
    }

    return aylar;
  }, [taksitler, aktifKartIdSet]);

  const maxTutar = useMemo(() => {
    return Math.max(
      1,
      ...projeksiyonAylari.map((a) => {
        if (gorunum === "mert") return a.mertPay;
        if (gorunum === "havsa") return a.havsaPay;
        return a.toplamTutar;
      })
    );
  }, [projeksiyonAylari, gorunum]);

  const baslangicTutar =
    gorunum === "mert"
      ? projeksiyonAylari[0]?.mertPay || 0
      : gorunum === "havsa"
      ? projeksiyonAylari[0]?.havsaPay || 0
      : projeksiyonAylari[0]?.toplamTutar || 0;

  const bitisTutar =
    gorunum === "mert"
      ? projeksiyonAylari[5]?.mertPay || 0
      : gorunum === "havsa"
      ? projeksiyonAylari[5]?.havsaPay || 0
      : projeksiyonAylari[5]?.toplamTutar || 0;

  const azalisYuzdesi =
    baslangicTutar > 0
      ? Math.max(0, Math.round(((baslangicTutar - bitisTutar) / baslangicTutar) * 100))
      : 0;

  const seciliAy =
    seciliAyIndex !== null
      ? projeksiyonAylari.find((a) => a.ayIndex === seciliAyIndex)
      : null;

  return (
    <div className="rounded-3xl border border-border/80 bg-surface shadow-xs p-5 sm:p-7 space-y-6">
      {/* Başlık ve Filtre Seçicisi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <h3 className="text-lg font-black tracking-tight text-foreground">
              Gelecek 6 Ayın Taksit Projeksiyonu
            </h3>
          </div>
          <p className="text-xs text-muted mt-1">
            Önümüzdeki aylarda taksitlerinizin nasıl azalacağını ve ne zaman biteceğini takip edin.
          </p>
        </div>

        {/* Görünüm Filtre Butonları */}
        <div className="flex items-center p-1 rounded-2xl bg-surface-raised border border-border/70 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setGorunum("toplam")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              gorunum === "toplam"
                ? "bg-surface text-foreground shadow-xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Toplam Yük
          </button>
          <button
            type="button"
            onClick={() => setGorunum("mert")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              gorunum === "mert"
                ? "bg-surface text-foreground shadow-xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Mert'in Payı
          </button>
          <button
            type="button"
            onClick={() => setGorunum("havsa")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              gorunum === "havsa"
                ? "bg-surface text-foreground shadow-xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Havsa'nın Payı
          </button>
        </div>
      </div>

      {/* Finansal Rahatlama Vurgusu */}
      {baslangicTutar > 0 && azalisYuzdesi > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-transparent border border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📉</span>
            <div>
              <span className="text-xs font-bold text-foreground block">
                6 Ay Sonra Taksit Yükünüz %{azalisYuzdesi} Azalıyor!
              </span>
              <span className="text-[11px] text-muted block">
                Şu anki {paraFormat(baslangicTutar)} aylık ödeme, 6. ayda {paraFormat(bitisTutar)} seviyesine düşecek.
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 block">
              Aylık Rahatlama
            </span>
            <span className="text-sm font-black text-emerald-400">
              +{paraFormat(baslangicTutar - bitisTutar)} / ay
            </span>
          </div>
        </div>
      )}

      {/* 6 Aylık Çubuk Grafik (Bar Chart Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {projeksiyonAylari.map((ay) => {
          const deger =
            gorunum === "mert"
              ? ay.mertPay
              : gorunum === "havsa"
              ? ay.havsaPay
              : ay.toplamTutar;

          const yukseklikYuzdesi = Math.max(12, Math.round((deger / maxTutar) * 100));
          const isSelected = seciliAyIndex === ay.ayIndex;
          const isCurrentMonth = ay.ayIndex === 0;

          return (
            <button
              key={`${ay.ayAdi}-${ay.yil}`}
              type="button"
              onClick={() => setSeciliAyIndex(isSelected ? null : ay.ayIndex)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-56 relative overflow-hidden group ${
                isSelected
                  ? "bg-primary/10 border-primary shadow-sm ring-2 ring-primary/30"
                  : isCurrentMonth
                  ? "bg-surface-raised/80 border-border hover:border-primary/50"
                  : "bg-surface-raised/40 border-border/60 hover:bg-surface-raised hover:border-border"
              }`}
            >
              {/* Tepe Başlığı: Dönem & Yıl */}
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-[11px] sm:text-xs font-black text-foreground block truncate"
                    title={ay.ayAdi}
                  >
                    {ay.ayAdi}
                  </span>
                  {isCurrentMonth && (
                    <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-primary text-white uppercase tracking-wider shrink-0">
                      Bu Dönem
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted block mt-0.5">{ay.yil}</span>
              </div>

              {/* Tutar & Dikey Çubuk */}
              <div className="space-y-2 mt-auto">
                <div className="text-left">
                  <span className="text-sm sm:text-base font-black text-foreground block tracking-tight">
                    {paraFormat(deger)}
                  </span>
                  <span className="text-[10px] text-muted block">
                    {ay.odenecekTaksitler.length} taksit
                  </span>
                </div>

                {/* Dikey İlerleme Barı */}
                <div className="h-16 w-full rounded-xl bg-surface border border-border/60 p-1 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      isCurrentMonth
                        ? "bg-gradient-to-t from-primary to-primary/80"
                        : deger === 0
                        ? "bg-transparent"
                        : "bg-gradient-to-t from-emerald-500/80 to-emerald-400"
                    }`}
                    style={{ height: `${yukseklikYuzdesi}%` }}
                  />
                </div>

                {/* Bu Ay Biten Varsa Rozet */}
                {ay.bitenUrunler.length > 0 ? (
                  <span className="text-[10px] font-bold text-emerald-400 block truncate flex items-center gap-1">
                    <span>🎉</span>
                    <span>{ay.bitenUrunler.length} taksit bitiyor</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted/60 block truncate">
                    Devam ediyor
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Seçili Ayın Detay Kartı (Tıklanınca Açılır) */}
      {seciliAy && (
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-raised border border-border animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-foreground flex items-center gap-2">
              <span>📅</span>
              <span>{seciliAy.ayAdi} {seciliAy.yil} Ödeme Detayları</span>
            </h4>
            <button
              type="button"
              onClick={() => setSeciliAyIndex(null)}
              className="text-xs text-muted hover:text-foreground font-semibold cursor-pointer"
            >
              Kapat ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {seciliAy.odenecekTaksitler.map((item, idx) => (
              <div
                key={`${item.urunAdi}-${idx}`}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  item.buAyBitiyor
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : "bg-surface border-border/70"
                }`}
              >
                <div>
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <span>{item.urunAdi}</span>
                    {item.buAyBitiyor && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black">
                        SON TAKSİT 🎉
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {item.kacinciTaksit}/{item.toplamTaksit}. taksit •{" "}
                    {item.sahip === "mert" ? "Mert" : item.sahip === "havsa" ? "Havsa" : "Ortak"}
                  </div>
                </div>

                <div className="text-right font-black text-foreground">
                  {paraFormat(item.aylikTutar)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
