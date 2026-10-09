"use client";

import React from "react";
import type { TaksitKarti, TaksitKalemi, KartRengi } from "@/domain/taksitTypes";
import { hesaplaTaksitVadesi, hesaplaKartSonOdemeDurumu } from "@/storage/taksitStorage";

interface TaksitKartGrubuProps {
  kart: TaksitKarti;
  taksitler: TaksitKalemi[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onEditTaksit: (taksit: TaksitKalemi) => void;
  onDeleteTaksit: (id: string) => void;
  onAddTaksitToKart: (kartId: string) => void;
  onEditKart: (kart: TaksitKarti) => void;
  onDeleteKart: (kartId: string) => void;
  onPayAllForKart: (kartId: string) => void;
  onToggleAktif?: (kartId: string, aktif: boolean) => void;
  isTopCard?: boolean;
}

const KART_RENK_TEMALARI: Record<KartRengi, { gradient: string; border: string; text: string; badge: string }> = {
  emerald: {
    gradient: "from-emerald-950/80 via-emerald-900/50 to-slate-900/80",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  blue: {
    gradient: "from-blue-950/80 via-blue-900/50 to-slate-900/80",
    border: "border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  purple: {
    gradient: "from-purple-950/80 via-purple-900/50 to-slate-900/80",
    border: "border-purple-500/30",
    text: "text-purple-400",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  amber: {
    gradient: "from-amber-950/80 via-amber-900/50 to-slate-900/80",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  rose: {
    gradient: "from-rose-950/80 via-rose-900/50 to-slate-900/80",
    border: "border-rose-500/30",
    text: "text-rose-400",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  slate: {
    gradient: "from-slate-900/90 via-slate-800/60 to-slate-950/90",
    border: "border-slate-500/30",
    text: "text-slate-300",
    badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  cyan: {
    gradient: "from-cyan-950/80 via-cyan-900/50 to-slate-900/80",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
};

const paraFormat = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(y, m - 1, d));
  } catch {
    return dateStr;
  }
}

export function TaksitKartGrubu({
  kart,
  taksitler,
  onIncrement,
  onDecrement,
  onEditTaksit,
  onDeleteTaksit,
  onAddTaksitToKart,
  onEditKart,
  onDeleteKart,
  onPayAllForKart,
  onToggleAktif,
  isTopCard,
}: TaksitKartGrubuProps) {
  const tema = KART_RENK_TEMALARI[kart.renk || "emerald"] || KART_RENK_TEMALARI.emerald;
  const isAktif = kart.aktif !== false;
  const sonOdemeDurum = hesaplaKartSonOdemeDurumu(kart);

  // Kart toplamları
  const aktifTaksitler = taksitler.filter((t) => t.odenenTaksit < t.toplamTaksit);
  const buKartAylikToplam = aktifTaksitler.reduce((sum, t) => sum + t.aylikTutar, 0);
  const buKartKalanToplam = aktifTaksitler.reduce(
    (sum, t) => sum + (t.toplamTaksit - t.odenenTaksit) * t.aylikTutar,
    0
  );

  // Kart Limiti Hesapları
  const hasLimit = typeof kart.kartLimiti === "number" && kart.kartLimiti > 0;
  const kartLimiti = kart.kartLimiti || 0;
  const kullanilanLimit = buKartKalanToplam;
  const kalanLimit = Math.max(0, kartLimiti - kullanilanLimit);
  const dolulukOrani = hasLimit ? Math.min(100, Math.round((kullanilanLimit / kartLimiti) * 100)) : 0;
  const limitBarRenk =
    dolulukOrani >= 80 ? "bg-rose-400" : dolulukOrani >= 50 ? "bg-amber-400" : "bg-emerald-400";

  const handlePayAll = () => {
    if (aktifTaksitler.length === 0) return;
    const onay = window.confirm(
      `"${kart.ad}" kartındaki tüm devam eden (${aktifTaksitler.length}) taksit 1 ay ilerletilsin mi?\n(Karttaki tüm aktif taksitlerin ödenen sayısı +1 artırılacaktır)`
    );
    if (onay) {
      onPayAllForKart(kart.id);
    }
  };

  return (
    <div
      className={`rounded-3xl border border-border/80 bg-surface shadow-xs overflow-hidden space-y-0 transition-all ${
        !isAktif ? "opacity-75" : ""
      }`}
    >
      {/* Kredi Kartı Başlık Bölümü (Stylized Credit Card Header) */}
      <div className={`p-5 sm:p-6 bg-gradient-to-br ${tema.gradient} border-b ${tema.border} text-white relative overflow-hidden`}>
        {/* Dekoratif Arka Plan Çizgileri */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Sol: Kart Bilgisi */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-2xl shadow-inner">
              💳
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  {kart.ad}
                </h3>

                {isTopCard && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1">
                    <span>👑</span>
                    <span>En Çok Taksitli ({taksitler.length})</span>
                  </span>
                )}

                {/* Son Ödeme Alarm / Hatırlatma Rozetleri */}
                {aktifTaksitler.length > 0 && sonOdemeDurum.durum === "bugun" && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse shadow-sm flex items-center gap-1">
                    <span>🚨</span>
                    <span>Son Ödeme Bugün!</span>
                  </span>
                )}
                {aktifTaksitler.length > 0 && sonOdemeDurum.durum === "cok_yakin" && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Son Ödemeye {sonOdemeDurum.kalanGun} Gün ({sonOdemeDurum.tarihStr})</span>
                  </span>
                )}
                {aktifTaksitler.length > 0 && sonOdemeDurum.durum === "yaklasiyor" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/20 flex items-center gap-1">
                    <span>⏰</span>
                    <span>{sonOdemeDurum.kalanGun} Gün Kaldı</span>
                  </span>
                )}

                {kart.sonHane && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/15">
                    •••• {kart.sonHane}
                  </span>
                )}

                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tema.badge}`}>
                  {kart.kartSahibi === "ortak" ? "👥 Ortak" : kart.kartSahibi === "mert" ? "👤 Mert" : "👤 Havsa"}
                </span>
              </div>

              {/* Ekstre & Son Ödeme Tarihleri */}
              <div className="flex items-center gap-3 text-xs text-white/80 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Ekstre Kesim: <strong>Her ayın {kart.ekstreGunu}'i</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>⏰</span>
                  <span>Son Ödeme: <strong>Her ayın {kart.sonOdemeGunu || kart.ekstreGunu + 10}'i</strong></span>
                </span>
              </div>

              {/* Aktiflik Durumu Checkbox */}
              <div className="flex items-center gap-2 mt-1.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs text-white/90 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={isAktif}
                    onChange={(e) => onToggleAktif?.(kart.id, e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/40 bg-white/20 accent-emerald-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold tracking-wide">Aktif</span>
                </label>
                {!isAktif && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-amber-300/90 border border-amber-300/20">
                    Hesaplama Dışı
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sağ: Kartın Aylık & Toplan Borç Özeti ve Eylem Butonları */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[10px] font-semibold text-white/70 block uppercase tracking-wider">
                  Aylık Taksit Yükü
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {paraFormat(buKartAylikToplam)}
                  <span className="text-xs text-white/70 font-normal"> / ay</span>
                </span>
                {!isAktif && (
                  <span className="text-[9px] text-amber-300 font-semibold block uppercase tracking-wider">
                    (Genel Toplama Dahil Değil)
                  </span>
                )}
              </div>

              <div className="hidden sm:block border-l border-white/15 pl-4">
                <span className="text-[10px] font-semibold text-white/70 block uppercase tracking-wider">
                  Kalan Toplam Borç
                </span>
                <span className="text-sm sm:text-base font-bold text-white/90">
                  {paraFormat(buKartKalanToplam)}
                </span>
              </div>
            </div>

            {/* Kart Aksiyonları */}
            <div className="flex items-center gap-1.5 pl-2">
              <button
                type="button"
                onClick={() => onAddTaksitToKart(kart.id)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-white/90 transition shadow-sm cursor-pointer"
                title="Bu karta yeni taksit ekle"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Taksit Ekle</span>
              </button>

              <button
                type="button"
                onClick={handlePayAll}
                disabled={aktifTaksitler.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  aktifTaksitler.length > 0
                    ? `Bu karttaki tüm devam eden (${aktifTaksitler.length}) taksiti 1 ay ilerlet (+1 Öde)`
                    : "Bu kartta devam eden taksit yok"
                }
              >
                <span>✓</span>
                <span className="hidden sm:inline">Taksit Öde</span>
                <span className="sm:hidden">Öde</span>
                {aktifTaksitler.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px] font-bold">
                    {aktifTaksitler.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onEditKart(kart)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs transition cursor-pointer"
                title="Kartı Düzenle"
              >
                ✏️
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`"${kart.ad}" kartını ve tüm taksitlerini silmek istediğinize emin misiniz?`)) {
                    onDeleteKart(kart.id);
                  }
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/40 border border-white/15 text-white text-xs transition cursor-pointer"
                title="Kartı Sil"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        {/* Kart Limiti & Doluluk İlerleme Çubuğu */}
        {hasLimit && (
          <div className="mt-4 pt-3.5 border-t border-white/15 relative z-10">
            <div className="flex items-center justify-between text-xs text-white/90 mb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">
                  Kart Limiti:
                </span>
                <span className="font-bold">{paraFormat(kartLimiti)}</span>
                <span className="text-white/40">•</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">
                  Taksitli Borç:
                </span>
                <span className="font-semibold text-white/90">{paraFormat(kullanilanLimit)}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">
                    Kullanılabilir:
                  </span>
                  <span className="font-extrabold text-emerald-300">
                    {paraFormat(kalanLimit)}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    dolulukOrani >= 80
                      ? "bg-rose-500/30 text-rose-200 border border-rose-400/30"
                      : "bg-white/15 text-white"
                  }`}
                >
                  %{dolulukOrani} Dolu
                </span>
              </div>
            </div>

            {/* İlerleme Çubuğu */}
            <div className="h-1.5 w-full rounded-full bg-black/35 overflow-hidden">
              <div
                className={`h-full ${limitBarRenk} transition-all duration-500 rounded-full`}
                style={{ width: `${dolulukOrani}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Taksitler Listesi (Installment Items) */}
      <div className="p-4 sm:p-5 space-y-3">
        {taksitler.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-border/80 bg-surface-raised/40 space-y-2">
            <span className="text-2xl block">🏷️</span>
            <p className="text-xs text-muted font-medium">
              Bu karta henüz taksitli alışveriş eklenmemiş.
            </p>
            <button
              type="button"
              onClick={() => onAddTaksitToKart(kart.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <span>➕</span> İlk Taksiti Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {taksitler.map((taksit) => {
              const vade = hesaplaTaksitVadesi(kart, taksit);
              const yuzde = Math.min(100, Math.round((taksit.odenenTaksit / taksit.toplamTaksit) * 100));

              return (
                <div
                  key={taksit.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    vade.tamamlandi
                      ? "bg-surface-raised/40 border-border/60 opacity-60"
                      : "bg-surface border-border/80 hover:border-border shadow-xs"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Sol: Ürün Başlığı & Sahibi */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground truncate">
                          {taksit.urunAdi}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-raised border border-border text-muted">
                          {taksit.sahip === "ortak" ? "👥 Ortak" : taksit.sahip === "mert" ? "👤 Mert" : "👤 Havsa"}
                        </span>

                        {vade.tamamlandi ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            ✓ Ödendi / Tamamlandı
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            {vade.kalanTaksit} Taksit Kaldı
                          </span>
                        )}
                      </div>

                      {/* Tarih & Vade Bilgileri */}
                      {!vade.tamamlandi && (
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          {/* Sıradaki Son Ödeme */}
                          <div className="flex items-center gap-1.5 text-foreground font-semibold">
                            <span className="text-amber-500">📅</span>
                            <span>Sıradaki Son Ödeme:</span>
                            <span className="text-primary font-bold">
                              {formatDisplayDate(vade.siradakiSonOdemeTarihi)}
                            </span>
                            {vade.siradakiSonOdemeKalanGun !== null && (
                              <span className="text-[11px] text-muted font-normal">
                                ({vade.siradakiSonOdemeKalanGun > 0 ? `${vade.siradakiSonOdemeKalanGun} gün kaldı` : "Bugün son gün!"})
                              </span>
                            )}
                          </div>

                          <span className="text-muted hidden sm:inline">•</span>

                          {/* Son Taksit Bitiş Tarihi */}
                          <div className="flex items-center gap-1.5 text-muted">
                            <span>🏁</span>
                            <span>Borç Bitiş Vadesi:</span>
                            <span className="text-foreground font-bold">
                              {formatDisplayDate(vade.bitisSonOdemeTarihi)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Orta: Tutarlar */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div>
                        <span className="text-[10px] text-muted block uppercase tracking-wider">
                          Aylık Taksit
                        </span>
                        <span className="text-sm font-black text-foreground">
                          {paraFormat(taksit.aylikTutar)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted block uppercase tracking-wider">
                          Kalan Borç
                        </span>
                        <span className="text-sm font-bold text-foreground/80">
                          {paraFormat(vade.kalanTutar)}
                        </span>
                      </div>
                    </div>

                    {/* Sağ: Taksit İlerleme Butonları & Aksiyonlar */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60 shrink-0">
                      {/* + / - İlerletme Mekanizması */}
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-raised border border-border">
                        <button
                          type="button"
                          onClick={() => onDecrement(taksit.id)}
                          disabled={taksit.odenenTaksit <= 0}
                          className="h-8 w-8 rounded-lg bg-surface hover:bg-border/40 text-foreground font-bold text-sm flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                          title="Ödenen taksit sayısını 1 azalt"
                        >
                          −
                        </button>

                        <div className="px-2 text-center">
                          <span className="text-xs font-black text-foreground block">
                            {taksit.odenenTaksit} / {taksit.toplamTaksit}
                          </span>
                          <span className="text-[9px] text-muted font-bold block">
                            Taksit
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onIncrement(taksit.id)}
                          disabled={taksit.odenenTaksit >= taksit.toplamTaksit}
                          className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 transition shadow-xs hover:opacity-90 disabled:opacity-30 cursor-pointer"
                          title="1 Taksit Ödendi olarak işaretle"
                        >
                          <span>+1 Öde</span>
                        </button>
                      </div>

                      {/* Düzenle & Sil */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTaksit(taksit)}
                          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer text-xs"
                          title="Taksiti Düzenle"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`"${taksit.urunAdi}" taksitini silmek istediğinize emin misiniz?`)) {
                              onDeleteTaksit(taksit.id);
                            }
                          }}
                          className="p-2 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-xs"
                          title="Taksiti Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* İlerleme Çubuğu (Progress Bar) */}
                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          vade.tamamlandi ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${yuzde}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-muted shrink-0">
                      %{yuzde} tamamlandı
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
