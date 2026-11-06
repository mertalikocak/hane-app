"use client";

import { useState } from "react";
import {
  WeddingStats,
  WeddingPiggyContribution,
  GoldPricesResponse,
  GoldType,
} from "@/domain/weddingTypes";
import { deletePiggyContribution } from "@/storage/weddingStorage";
import { CloseIcon, TrashIcon, EditIcon } from "@/components/ui/Icons";

interface GoldPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: WeddingStats;
  goldPrices: GoldPricesResponse | null;
  isPricesLoading: boolean;
  onRefreshPrices: () => Promise<void>;
  katkilar: WeddingPiggyContribution[];
  onDataChange: () => void;
  onEditContribution: (katki: WeddingPiggyContribution) => void;
  onOpenAddGold: () => void;
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

const formatTarih = (isoString?: string | null) => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
};

const GOLD_ICONS: Record<GoldType, string> = {
  gram: "🪙",
  ceyrek: "🟡",
  yarim: "🟠",
  tam: "👑",
};

export function GoldPortfolioModal({
  isOpen,
  onClose,
  stats,
  goldPrices,
  isPricesLoading,
  onRefreshPrices,
  katkilar,
  onDataChange,
  onEditContribution,
  onOpenAddGold,
}: GoldPortfolioModalProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const altinKatkilari = katkilar.filter((k) => k.assetType === "gold");
  const hasAnyGold = altinKatkilari.length > 0;
  const isStale = goldPrices?.isStale;
  const isNetKar = stats.altinKarZararTL >= 0;

  const handleDelete = (id: string) => {
    deletePiggyContribution(id);
    setConfirmDeleteId(null);
    onDataChange();
  };

  const goldTypesList: GoldType[] = ["gram", "ceyrek", "yarim", "tam"];

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl rounded-2xl bg-surface border border-border shadow-xl p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Başlığı */}
        <div className="flex items-start justify-between pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
              🪙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Altın Portföyü & Varlık Detayları
                </h3>
                <span className="ds-badge ds-badge-primary text-[10px] uppercase font-bold tracking-wider">
                  Hesaplı Altın API
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Fiziksel altın varlıklarınızın anlık Kapalıçarşı piyasa değeri ve kâr/zarar analizi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-8 w-8 text-muted hover:text-foreground"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Canlı Fiyat Bilgisi & Uyarı Çubuğu */}
        <div className="p-3 rounded-xl bg-surface-raised border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full ${
                goldPrices?.piyasa === "canli"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            />
            <span className="font-semibold text-foreground">
              {goldPrices?.piyasa === "canli" ? "Piyasa Canlı" : "Piyasa Kapalı / Durgun"}
            </span>
            <span className="text-muted">•</span>
            <span className="text-muted">
              Son Güncelleme:{" "}
              <strong className="text-foreground font-semibold">
                {formatTarih(goldPrices?.updatedAt)}
              </strong>
            </span>
            {isStale && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 font-bold text-[10px]">
                ⚠️ Eski Fiyat
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onRefreshPrices}
              disabled={isPricesLoading}
              className="secondary-button text-xs py-1 px-2.5 h-7 min-h-0 flex items-center gap-1.5"
            >
              <span className={isPricesLoading ? "animate-spin" : ""}>🔄</span>
              <span>{isPricesLoading ? "Güncelleniyor..." : "Fiyatları Yenile"}</span>
            </button>
          </div>
        </div>

        {/* API Uyarı Mesajı (Varsa) */}
        {goldPrices?.errorMessage && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-medium flex items-center gap-2 shrink-0">
            <span>ℹ️</span>
            <span>{goldPrices.errorMessage}</span>
          </div>
        )}

        {/* İçerik Alanı (Kaydırılabilir) */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-1">
          {/* 1. Üst Toplam Özet Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Toplam Güncel Değer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Altınların Güncel Değeri
              </span>
              <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                {para(stats.toplamAltinGuncelDeger)}
              </div>
              <p className="text-[10px] text-muted mt-1">
                Bozdurma (Kuyumcu Alış) Fiyatıyla
              </p>
            </div>

            {/* Toplam Alış Maliyeti */}
            <div className="p-4 rounded-xl bg-surface-raised border border-border">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Toplam Alış Maliyeti
              </span>
              <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                {para(stats.toplamAltinAlisMaliyeti)}
              </div>
              <p className="text-[10px] text-muted mt-1">
                Kullanıcıların satın alma harcaması
              </p>
            </div>

            {/* Net Kâr / Zarar */}
            <div
              className={`p-4 rounded-xl border ${
                isNetKar
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-800"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider block">
                Net Kâr / Zarar
              </span>
              <div className="text-2xl font-bold mt-1 tabular-nums">
                {isNetKar ? "+" : ""}
                {para(stats.altinKarZararTL)}
              </div>
              <p className="text-[10px] font-semibold mt-1 tabular-nums">
                {isNetKar ? "▲" : "▼"} %{formatSayi(stats.altinKarZararYuzde)} değişim
              </p>
            </div>
          </div>

          {/* 2. Altın Türlerine Göre Ayrıntılı Kartlar */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>📊</span> Altın Türü Dağılımı ve Birim Fiyatlar
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goldTypesList.map((t) => {
                const s = stats.goldSummaries[t];
                const isKar = s.karZararTL >= 0;
                const hasItem = s.miktar > 0;

                return (
                  <div
                    key={t}
                    className={`p-4 rounded-xl border transition ${
                      hasItem
                        ? "bg-surface border-border shadow-2xs"
                        : "bg-surface-raised/50 border-border/60 opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{GOLD_ICONS[t]}</span>
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            {s.etiket}
                          </div>
                          <div className="text-[11px] text-muted tabular-nums">
                            Birim Alış (Bozdurma):{" "}
                            <strong className="text-foreground">
                              {para(s.guncelBirimAlisFiyati)}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                          hasItem
                            ? "bg-primary text-white"
                            : "bg-surface-raised text-muted border border-border"
                        }`}
                      >
                        {formatSayi(s.miktar)} {s.birim}
                      </span>
                    </div>

                    {hasItem ? (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-muted block">Alış Maliyeti</span>
                          <span className="font-bold text-foreground tabular-nums">
                            {para(s.toplamAlisMaliyeti)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted block">Güncel Değer</span>
                          <span className="font-bold text-primary tabular-nums">
                            {para(s.guncelToplamDeger)}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-muted">Kâr / Zarar Durumu:</span>
                          <span
                            className={`font-bold tabular-nums text-xs px-2 py-0.5 rounded-md ${
                              isKar
                                ? "bg-emerald-500/15 text-emerald-700"
                                : "bg-rose-500/15 text-rose-700"
                            }`}
                          >
                            {isKar ? "+" : ""}
                            {para(s.karZararTL)} (%{formatSayi(s.karZararYuzde)})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 text-[11px] text-muted italic">
                        Henüz {s.etiket.toLowerCase()} kaydı bulunmuyor.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Bireysel Altın Kayıtları & Yönetim (Düzenle / Sil) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>📜</span> Fiziksel Altın Kayıtları ({altinKatkilari.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddGold();
                }}
                className="primary-button text-xs py-1 px-3 h-7 min-h-0"
              >
                + Yeni Altın Ekle
              </button>
            </div>

            {!hasAnyGold ? (
              <div className="py-8 text-center rounded-xl bg-surface-raised border border-border p-4 text-xs text-muted space-y-2">
                <p>Kumbaranızda henüz kayıtlı altın bulunmuyor.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddGold();
                  }}
                  className="primary-button text-xs py-1.5 px-3"
                >
                  🪙 İlk Altını Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {altinKatkilari.map((k) => {
                  const goldType = k.goldType || "gram";
                  const unitPrice =
                    goldPrices?.kalemler?.[goldType]?.alis &&
                    Number(goldPrices.kalemler[goldType].alis) > 0
                      ? Number(goldPrices.kalemler[goldType].alis)
                      : Number(k.birimAlisFiyati) || 0;
                  const guncelTutar = (Number(k.miktar) || 0) * unitPrice;
                  const maliyet =
                    Number(k.toplamAlisMaliyeti) ||
                    (Number(k.miktar) || 0) * (Number(k.birimAlisFiyati) || 0) ||
                    Number(k.tutar) ||
                    0;
                  const fark = guncelTutar - maliyet;
                  const isKar = fark >= 0;

                  return (
                    <div
                      key={k.id}
                      className="p-3.5 rounded-xl bg-surface-raised border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                          {GOLD_ICONS[goldType]}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground text-sm">
                              {formatSayi(Number(k.miktar) || 0)}{" "}
                              {goldType === "gram" ? "Gram" : "Adet"}{" "}
                              {stats.goldSummaries[goldType]?.etiket}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-border text-muted font-semibold">
                              {k.ekleyenKisi === "mert"
                                ? "👤 Mert"
                                : k.ekleyenKisi === "havsa"
                                ? "👩 Havsa"
                                : k.ekleyenKisi === "ortak"
                                ? "👥 Ortak"
                                : "🎁 Aile"}
                            </span>
                            <span className="text-[10px] text-muted tabular-nums">
                              {k.tarih}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted flex-wrap tabular-nums">
                            <span>
                              Alış Birim:{" "}
                              <strong className="text-foreground">
                                {para(Number(k.birimAlisFiyati) || 0)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Maliyet:{" "}
                              <strong className="text-foreground">
                                {para(maliyet)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Güncel Değer:{" "}
                              <strong className="text-primary">
                                {para(guncelTutar)}
                              </strong>
                            </span>
                            <span
                              className={`font-semibold ${
                                isKar ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              ({isKar ? "+" : ""}
                              {para(fark)})
                            </span>
                          </div>

                          {k.aciklama && (
                            <p className="text-[11px] text-muted mt-1 italic">
                              &ldquo;{k.aciklama}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Aksiyonlar: Düzenle / Sil */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditContribution(k);
                          }}
                          className="icon-button h-8 w-8 text-muted hover:text-primary"
                          title="Düzenle"
                        >
                          <EditIcon size={14} />
                        </button>

                        {confirmDeleteId === k.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(k.id)}
                              className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-2 py-0.5 text-[10px] h-7 min-h-0"
                            >
                              Sil
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="secondary-button px-2 py-0.5 text-[10px] h-7 min-h-0"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(k.id)}
                            className="icon-button h-8 w-8 text-muted hover:text-rose-600"
                            title="Sil"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Alt Kısım Buton */}
        <div className="pt-3 border-t border-border flex items-center justify-between shrink-0">
          <p className="text-[11px] text-muted">
            Fiyatlar Hesaplı Altın serbest piyasa ve Kapalıçarşı verilerinden çekilmektedir.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="secondary-button px-4 py-1.5 text-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

