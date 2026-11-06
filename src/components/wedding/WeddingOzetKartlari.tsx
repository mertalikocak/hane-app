"use client";

import { useState } from "react";
import { WeddingStats } from "@/domain/weddingTypes";
import { PlusIcon } from "@/components/ui/Icons";

interface WeddingOzetKartlariProps {
  stats: WeddingStats;
  onOpenKumbaraModal: (initialTab?: "nakit" | "altin") => void;
  onOpenGoldPortfolio: () => void;
  isPricesLoading?: boolean;
  onRefreshPrices?: () => Promise<void>;
  isStalePrices?: boolean;
}

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);

const formatSayi = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(n);

export function WeddingOzetKartlari({
  stats,
  onOpenKumbaraModal,
  onOpenGoldPortfolio,
  isPricesLoading = false,
  onRefreshPrices,
  isStalePrices = false,
}: WeddingOzetKartlariProps) {
  const isKalanPozitif = stats.kalanKumbara >= 0;
  const [isAltinDetayAcik, setIsAltinDetayAcik] = useState(false);

  // Varlık gösterimi için altın listesi
  const altinMevcutListesi: { etiket: string; miktar: number; birim: string }[] = [];
  if (stats.toplamAltinAdetGram.gram > 0) {
    altinMevcutListesi.push({
      etiket: "Gram Altın",
      miktar: stats.toplamAltinAdetGram.gram,
      birim: "gr",
    });
  }
  if (stats.toplamAltinAdetGram.ceyrek > 0) {
    altinMevcutListesi.push({
      etiket: "Çeyrek",
      miktar: stats.toplamAltinAdetGram.ceyrek,
      birim: "adet",
    });
  }
  if (stats.toplamAltinAdetGram.yarim > 0) {
    altinMevcutListesi.push({
      etiket: "Yarım",
      miktar: stats.toplamAltinAdetGram.yarim,
      birim: "adet",
    });
  }
  if (stats.toplamAltinAdetGram.tam > 0) {
    altinMevcutListesi.push({
      etiket: "Tam Altın",
      miktar: stats.toplamAltinAdetGram.tam,
      birim: "adet",
    });
  }

  const hasGold = altinMevcutListesi.length > 0;

  return (
    <div className="space-y-4">
      {/* 4 Ana Özet Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Kart 1: Kalan Kumbara Parası (Net Bütçe) */}
        <div
          className={`ds-card-lavender p-5 flex flex-col justify-between ${
            !isKalanPozitif ? "border-rose-500/35 bg-rose-500/5" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Kalan Kumbara Bütçesi
            </span>
            <span className="w-8 h-8 rounded-xl bg-accent border border-border-lavender flex items-center justify-center text-base">
              🏦
            </span>
          </div>

          <div className="my-2.5">
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                isKalanPozitif ? "text-primary" : "text-rose-700"
              }`}
            >
              {para(stats.kalanKumbara)}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Nakit + altın varlığından alınanların düşülmüş net hali
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => onOpenKumbaraModal("nakit")}
              className="primary-button py-1.5 px-2 text-xs h-8 min-h-0 justify-center"
            >
              <PlusIcon size={13} /> Nakit Ekle
            </button>
            <button
              type="button"
              onClick={() => onOpenKumbaraModal("altin")}
              className="secondary-button bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border-amber-500/30 py-1.5 px-2 text-xs h-8 min-h-0 justify-center font-bold"
            >
              🪙 Altın Ekle
            </button>
          </div>
        </div>

        {/* Kart 2: Toplam Biriken Kumbara & Altın Varlıkları (Geliştirilen Kart) */}
        <div className="ds-card p-5 flex flex-col justify-between border-amber-500/25 bg-surface relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Toplam Kumbara Değeri
              </span>
              <span className="text-[10px] text-muted">Nakit + Güncel Altın Değeri</span>
            </div>
            <div className="flex items-center gap-1">
              {onRefreshPrices && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefreshPrices();
                  }}
                  disabled={isPricesLoading}
                  className="icon-button h-6 w-6 text-muted hover:text-foreground text-[10px]"
                  title="Fiyatları Yenile"
                >
                  <span className={isPricesLoading ? "animate-spin" : ""}>🔄</span>
                </button>
              )}
              <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-base">
                🪙
              </span>
            </div>
          </div>

          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {para(stats.toplamBiriken)}
            </div>

            {/* Nakit ve Altın Dağılımı */}
            <div className="flex items-center gap-2 mt-1.5 text-xs tabular-nums flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 font-bold text-[11px]">
                💵 Nakit: {para(stats.toplamNakitBiriken)}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 font-bold text-[11px]">
                🪙 Altın: {para(stats.toplamAltinGuncelDeger)}
              </span>
            </div>

            {/* Altın Varlıkları Özeti */}
            <div className="mt-2.5 pt-2 border-t border-border/80 text-xs">
              {hasGold ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-muted flex items-center gap-1">
                      <span>🟡</span> Altın Varlıkları:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAltinDetayAcik(!isAltinDetayAcik)}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      {isAltinDetayAcik ? "Gizle ▲" : "Göster ▼"}
                    </button>
                  </div>

                  {/* Hap Şeklinde Altın Dağılımı */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {altinMevcutListesi.map((a, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-surface-raised border border-border text-[11px] font-semibold text-foreground tabular-nums"
                      >
                        {formatSayi(a.miktar)} {a.birim} {a.etiket}
                      </span>
                    ))}
                  </div>

                  {/* Açılır Ayrıntılı Kâr/Zarar Alanı */}
                  {isAltinDetayAcik && (
                    <div className="mt-2 p-2 rounded-lg bg-surface-raised border border-border text-[11px] space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between text-muted">
                        <span>Alış Maliyeti:</span>
                        <strong className="text-foreground tabular-nums">
                          {para(stats.toplamAltinAlisMaliyeti)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-muted">
                        <span>Güncel Değer:</span>
                        <strong className="text-primary tabular-nums">
                          {para(stats.toplamAltinGuncelDeger)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <span className="font-semibold text-foreground">Kâr / Zarar:</span>
                        <span
                          className={`font-bold tabular-nums ${
                            stats.altinKarZararTL >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {stats.altinKarZararTL >= 0 ? "+" : ""}
                          {para(stats.altinKarZararTL)} (%
                          {formatSayi(stats.altinKarZararYuzde)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>Henüz altın eklenmedi</span>
                  <button
                    type="button"
                    onClick={() => onOpenKumbaraModal("altin")}
                    className="text-primary hover:underline font-semibold"
                  >
                    + Altın Ekle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alt Kısım: Detay Butonu ve Kişi Dağılımı */}
          <div className="pt-2 border-t border-border space-y-1.5">
            <button
              type="button"
              onClick={onOpenGoldPortfolio}
              className="w-full py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/25 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>📊</span> Altın Portföyü Detay Ekranı →
            </button>

            <div className="flex items-center justify-between text-[10px] text-muted font-medium tabular-nums pt-1">
              <span>👤 M: {para(stats.mertBiriken)}</span>
              <span>•</span>
              <span>👩 H: {para(stats.havsaBiriken)}</span>
              {stats.ortakBiriken > 0 && (
                <>
                  <span>•</span>
                  <span>👥 Ortak: {para(stats.ortakBiriken)}</span>
                </>
              )}
              {stats.digerBiriken > 0 && (
                <>
                  <span>•</span>
                  <span>🎁 Aile: {para(stats.digerBiriken)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kart 3: Harcanan (Alınan / Tiklenen Kalemler) */}
        <div className="ds-card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Ödenen / Alınanlar
            </span>
            <span className="w-8 h-8 rounded-xl bg-accent/70 border border-border-lavender flex items-center justify-center text-base">
              🛍️
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-bold text-primary tabular-nums">
              {para(stats.harcananPara)}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Tiklenen {stats.tamamlananSayisi} kalemin toplam ücreti
            </p>
          </div>

          <div className="text-[11px] text-muted border-t border-border pt-2 flex items-center justify-between tabular-nums">
            <span>Alınma Oranı:</span>
            <span className="font-bold text-primary">
              %{stats.tamamlanmaYuzdesi} ({stats.tamamlananSayisi}/{stats.toplamMaddeSayisi})
            </span>
          </div>
        </div>

        {/* Kart 4: Kalan Alınacaklar Listesi Tutarı */}
        <div className="ds-card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Kalan Alınacaklar
            </span>
            <span className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-base">
              ⏳
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-bold text-rose-700 tabular-nums">
              {para(stats.kalanGerekenHarcama)}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Henüz alınmamış {stats.toplamMaddeSayisi - stats.tamamlananSayisi} kalemin maliyeti
            </p>
          </div>

          <div className="text-[11px] text-muted border-t border-border pt-2 flex items-center justify-between tabular-nums">
            <span>Toplam Tahmini Bütçe:</span>
            <span className="font-bold text-foreground">{para(stats.toplamGerekenButce)}</span>
          </div>
        </div>
      </div>

      {/* İlerleme ve Bütçe Durumu Çubuğu */}
      <div className="ds-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-base">🎯</span>
          <div>
            <div className="font-bold text-foreground tabular-nums flex items-center gap-2">
              <span>Düğün Bütçesi Karşılama Oranı: %{stats.kumbaraKarsilamaYuzdesi}</span>
              {isStalePrices && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 font-semibold">
                  Eski Kur
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted tabular-nums">
              Kumbaradaki toplam {para(stats.toplamBiriken)} (Nakit + Güncel Altın), tahmini{" "}
              {para(stats.toplamGerekenButce)} bütçenin %{stats.kumbaraKarsilamaYuzdesi}
              &apos;sini karşılıyor.
            </div>
          </div>
        </div>
        <div className="w-full sm:w-48 bg-background-subtle rounded-full h-2.5 border border-border overflow-hidden shrink-0">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, stats.kumbaraKarsilamaYuzdesi)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
