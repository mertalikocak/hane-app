"use client";

import { WeddingStats } from "@/domain/weddingTypes";
import { PlusIcon } from "@/components/ui/Icons";

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
              Biriken paradan alınanların düşülmüş net hali
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenKumbaraModal}
            className="primary-button w-full mt-1 py-1.5 px-3 text-xs h-8 min-h-0"
          >
            <PlusIcon size={14} /> Kumbaraya Para Ekle
          </button>
        </div>

        {/* Kart 2: Toplam Biriken Kumbara */}
        <div className="ds-card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Toplam Biriken Para
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-base">
              🪙
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {para(stats.toplamBiriken)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted font-medium tabular-nums">
              <span className="text-sky-700 font-semibold">
                👤 Mert: {para(stats.mertBiriken)}
              </span>
              <span>•</span>
              <span className="text-pink-700 font-semibold">
                👩 Havsa: {para(stats.havsaBiriken)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-muted border-t border-border pt-2 flex items-center justify-between tabular-nums">
            <span>Aile / Diğer Katkı:</span>
            <span className="font-bold text-foreground">{para(stats.digerBiriken)}</span>
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
            <div className="font-bold text-foreground tabular-nums">
              Düğün Bütçesi Karşılama Oranı: %{stats.kumbaraKarsilamaYuzdesi}
            </div>
            <div className="text-[11px] text-muted tabular-nums">
              Kumbaradaki {para(stats.toplamBiriken)} toplam tahmini {para(stats.toplamGerekenButce)} bütçenin %{stats.kumbaraKarsilamaYuzdesi}&apos;sini karşılıyor.
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
