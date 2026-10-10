"use client";

import { WeddingStats } from "@/domain/weddingTypes";

interface WeddingOzetKartlariProps {
  stats: WeddingStats;
  onOpenKumbaraModal: () => void;
}

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);

export function WeddingOzetKartlari({ stats, onOpenKumbaraModal }: WeddingOzetKartlariProps) {
  const isKalanPozitif = stats.kalanKumbara >= 0;

  return (
    <div className="space-y-4">
      {/* 4 Ana Özet Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Kart 1: Kalan Kumbara Parası (Ana Odak) */}
        <div
          className={`relative overflow-hidden rounded-3xl p-5 border shadow-sm transition-all flex flex-col justify-between ${
            isKalanPozitif
              ? "bg-gradient-to-br from-amber-500/15 via-surface to-surface border-amber-500/30"
              : "bg-gradient-to-br from-rose-500/15 via-surface to-surface border-rose-500/30"
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Kalan Kumbara Bütçesi
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-base shadow-2xs">
              🏦
            </span>
          </div>

          <div className="my-2.5">
            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isKalanPozitif ? "text-amber-500 dark:text-amber-400" : "text-rose-500"
              }`}
            >
              {para(stats.kalanKumbara)}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Biriken paradan alınanların düşülmüş net hali
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenKumbaraModal}
            className="w-full mt-1 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 dark:text-amber-400 font-bold text-xs border border-amber-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>➕</span> Kumbaraya Para Ekle
          </button>
        </div>

        {/* Kart 2: Toplam Biriken Kumbara */}
        <div className="rounded-3xl bg-surface border border-border/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Toplam Biriken Para
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-base">
              🪙
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-black text-foreground">
              {para(stats.toplamBiriken)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted font-medium">
              <span className="text-sky-500 dark:text-sky-400">
                👤 Mert: {para(stats.mertBiriken)}
              </span>
              <span>•</span>
              <span className="text-pink-500 dark:text-pink-400">
                👩 Havsa: {para(stats.havsaBiriken)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-muted border-t border-border/60 pt-2 flex items-center justify-between">
            <span>Aile / Diğer Katkı:</span>
            <span className="font-bold text-foreground">{para(stats.digerBiriken)}</span>
          </div>
        </div>

        {/* Kart 3: Harcanan (Alınan / Tiklenen Kalemler) */}
        <div className="rounded-3xl bg-surface border border-border/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Ödenen / Alınanlar
            </span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-base">
              🛍️
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-black text-purple-500 dark:text-purple-400">
              {para(stats.harcananPara)}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Tiklenen {stats.tamamlananSayisi} kalemin toplam ücreti
            </p>
          </div>

          <div className="text-[11px] text-muted border-t border-border/60 pt-2 flex items-center justify-between">
            <span>Alınma Oranı:</span>
            <span className="font-bold text-purple-400">
              %{stats.tamamlanmaYuzdesi} ({stats.tamamlananSayisi}/{stats.toplamMaddeSayisi})
            </span>
          </div>
        </div>

        {/* Kart 4: Kalan Alınacaklar Listesi Tutarı */}
        <div className="rounded-3xl bg-surface border border-border/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Kalan Alınacaklar
            </span>
            <span className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-base">
              ⏳
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-black text-rose-500 dark:text-rose-400">
              {para(stats.kalanGerekenHarcama)}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Henüz alınmamış {stats.toplamMaddeSayisi - stats.tamamlananSayisi} kalemin maliyeti
            </p>
          </div>

          <div className="text-[11px] text-muted border-t border-border/60 pt-2 flex items-center justify-between">
            <span>Toplam Tahmini Bütçe:</span>
            <span className="font-bold text-foreground">{para(stats.toplamGerekenButce)}</span>
          </div>
        </div>
      </div>

      {/* İlerleme ve Bütçe Durumu Çubuğu */}
      <div className="p-4 rounded-2xl bg-surface-raised border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-base">🎯</span>
          <div>
            <div className="font-bold text-foreground">
              Düğün Bütçesi Karşılama Oranı: %{stats.kumbaraKarsilamaYuzdesi}
            </div>
            <div className="text-[11px] text-muted">
              Kumbaradaki {para(stats.toplamBiriken)} toplam tahmini {para(stats.toplamGerekenButce)} bütçenin %{stats.kumbaraKarsilamaYuzdesi}&apos;sini karşılıyor.
            </div>
          </div>
        </div>
        <div className="w-full sm:w-48 bg-surface rounded-full h-2.5 border border-border overflow-hidden shrink-0">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats.kumbaraKarsilamaYuzdesi)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
