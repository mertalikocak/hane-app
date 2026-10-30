"use client";

import React, { useState, useMemo } from "react";
import { para, KULLANICI_ETIKET } from "./constants";
import type { LedgerItem } from "./types";
import type {
  AyHaneGiderVerisi,
  KrediKartiEkstresi,
  BireyselAyriHarcama,
  BireyselEkstreKalemi,
} from "@/domain/haneGiderTypes";
import { tekKartHesabi, toplumaDahilKartlar } from "@/domain/ekstreHesapla";
import { SearchIcon, CloseIcon, EditIcon, TrashIcon } from "@/components/ui/Icons";

interface GiderV2LedgerTableProps {
  veri: AyHaneGiderVerisi;
  onKartDuzenle: (kart: KrediKartiEkstresi) => void;
  onKartSil: (id: string) => void;
  onBireyselKalemDuzenle?: (kartId: string, kartAdi: string, kalem: BireyselEkstreKalemi) => void;
  onBireyselKalemSil?: (kartId: string, kalemId: string) => void;
  onAyriHarcamaDuzenle: (h: BireyselAyriHarcama) => void;
  onAyriHarcamaSil: (id: string) => void;
  onTransferSil: (id: string) => void;
}

export function GiderV2LedgerTable({
  veri,
  onKartDuzenle,
  onKartSil,
  onBireyselKalemDuzenle,
  onBireyselKalemSil,
  onAyriHarcamaDuzenle,
  onAyriHarcamaSil,
  onTransferSil,
}: GiderV2LedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [personFilter, setPersonFilter] = useState<"all" | "mert" | "havsa" | "ortak">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "kart" | "bireysel" | "transfer">("all");
  const [sortBy, setSortBy] = useState<"amount_desc" | "amount_asc" | "title">("amount_desc");

  // Tüm verileri düz, denetlenebilir bir defter (Ledger) listesine dönüştür
  const ledgerItems = useMemo<LedgerItem[]>(() => {
    const items: LedgerItem[] = [];

    // 1. Kredi Kartları ve Ortak Harcamalar
    const dahilKartlar = toplumaDahilKartlar(veri.krediKartlari);
    for (const kart of dahilKartlar) {
      const h = tekKartHesabi(kart);
      const odeyen =
        kart.odenenKisi ??
        (kart.ad.toLowerCase().includes("havsa")
          ? "havsa"
          : kart.ad.toLowerCase().includes("mert")
          ? "mert"
          : "mert");

      const isHarcama = kart.kayitTipi === "harcama";
      const kimeAit = kart.kimeAit ?? "ortak";

      if (kimeAit === "mert") {
        items.push({
          id: `kart-base-${kart.id}`,
          tur: "kart",
          ad: kart.ad,
          detay: isHarcama ? "Bireysel Harcama (Mert)" : "Bireysel Kredi Kartı (Mert)",
          odeyen,
          kimeAit: "mert",
          tutar: kart.toplamEkstre,
          mertYuku: kart.toplamEkstre,
          havsaYuku: 0,
          orijinalKartId: kart.id,
        });
      } else if (kimeAit === "havsa") {
        items.push({
          id: `kart-base-${kart.id}`,
          tur: "kart",
          ad: kart.ad,
          detay: isHarcama ? "Bireysel Harcama (Havsa)" : "Bireysel Kredi Kartı (Havsa)",
          odeyen,
          kimeAit: "havsa",
          tutar: kart.toplamEkstre,
          mertYuku: 0,
          havsaYuku: kart.toplamEkstre,
          orijinalKartId: kart.id,
        });
      } else {
        if (h.ortakTaban > 0 || kart.bireyselKalemler.length === 0) {
          items.push({
            id: `kart-base-${kart.id}`,
            tur: "kart",
            ad: kart.ad,
            detay: isHarcama ? "Ortak Harcama" : kart.bireyselKalemler.length > 0 ? "Ortak Paylaşım Kısmı" : "Kredi Kartı Ekstresi",
            odeyen,
            kimeAit: "ortak",
            tutar: h.ortakTaban,
            mertYuku: h.ortakTaban / 2,
            havsaYuku: h.ortakTaban / 2,
            orijinalKartId: kart.id,
          });
        }

        for (const bk of kart.bireyselKalemler) {
          const isMert = bk.kullaniciId === "mert";
          items.push({
            id: `kart-kalem-${bk.id}`,
            tur: "bireysel_kalem",
            ad: `${kart.ad} › ${bk.aciklama}`,
            detay: `Ekstre içi bireysel (${KULLANICI_ETIKET[bk.kullaniciId]})`,
            odeyen,
            kimeAit: bk.kullaniciId,
            tutar: bk.tutar,
            mertYuku: isMert ? bk.tutar : 0,
            havsaYuku: !isMert ? bk.tutar : 0,
            orijinalKartId: kart.id,
            orijinalKalemId: bk.id,
          });
        }
      }
    }

    // 2. Ayrı Bireysel Harcamalar (Ortak kayıt dışı)
    for (const h of veri.bireyselAyriHarcamalar) {
      const isMert = h.kullaniciId === "mert";
      items.push({
        id: `ayri-${h.id}`,
        tur: "ayri_harcama",
        ad: h.aciklama,
        detay: "Ayrı Kişisel Harcama",
        odeyen: h.kullaniciId,
        kimeAit: h.kullaniciId,
        tutar: h.tutar,
        mertYuku: isMert ? h.tutar : 0,
        havsaYuku: !isMert ? h.tutar : 0,
      });
    }

    // 3. Transferler
    for (const tr of veri.transferler ?? []) {
      items.push({
        id: `tr-${tr.id}`,
        tur: "transfer",
        ad: `Para Transferi: ${KULLANICI_ETIKET[tr.gonderen]} ➔ ${KULLANICI_ETIKET[tr.alan]}`,
        detay: tr.aciklama || "Mahsuplaşma Transferi",
        odeyen: tr.gonderen,
        kimeAit: tr.alan,
        tutar: tr.tutar,
        mertYuku: 0,
        havsaYuku: 0,
        tarih: tr.tarih,
      });
    }

    return items;
  }, [veri]);

  // Filtreleme ve Arama
  const filteredItems = useMemo(() => {
    return ledgerItems
      .filter((item) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = item.ad.toLowerCase().includes(q);
          const matchDetail = item.detay?.toLowerCase().includes(q) ?? false;
          if (!matchTitle && !matchDetail) return false;
        }

        if (personFilter === "mert" && item.odeyen !== "mert" && item.kimeAit !== "mert") {
          return false;
        }
        if (personFilter === "havsa" && item.odeyen !== "havsa" && item.kimeAit !== "havsa") {
          return false;
        }
        if (personFilter === "ortak" && item.kimeAit !== "ortak") {
          return false;
        }

        if (typeFilter === "kart" && item.tur !== "kart") return false;
        if (typeFilter === "bireysel" && item.tur !== "bireysel_kalem" && item.tur !== "ayri_harcama") {
          return false;
        }
        if (typeFilter === "transfer" && item.tur !== "transfer") return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "amount_desc") return b.tutar - a.tutar;
        if (sortBy === "amount_asc") return a.tutar - b.tutar;
        return a.ad.localeCompare(b.ad, "tr");
      });
  }, [ledgerItems, searchTerm, personFilter, typeFilter, sortBy]);

  // Canlı Toplamlar
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        if (item.tur !== "transfer") {
          acc.toplamTutar += item.tutar;
          if (item.odeyen === "mert") acc.mertOdedi += item.tutar;
          if (item.odeyen === "havsa") acc.havsaOdedi += item.tutar;
          acc.mertYuku += item.mertYuku;
          acc.havsaYuku += item.havsaYuku;
        } else {
          acc.transferToplami += item.tutar;
        }
        return acc;
      },
      {
        toplamTutar: 0,
        mertOdedi: 0,
        havsaOdedi: 0,
        mertYuku: 0,
        havsaYuku: 0,
        transferToplami: 0,
      }
    );
  }, [filteredItems]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Başlık ve Filtre Kontrol Çubuğu */}
      <div className="ds-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-lavender border border-border-lavender text-primary flex items-center justify-center text-lg shrink-0">
              🔍
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Hesap İnceleme & Denetim Tablosu</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-lavender text-primary border border-border-lavender">
                  {filteredItems.length} Kalem
                </span>
              </h3>
              <p className="text-xs text-muted">
                Tüm kartlar, bireysel harcamalar ve transferler tek şeffaf listede. Her kuruşun kaynağını inceleyin.
              </p>
            </div>
          </div>

          {/* Sıralama Seçici */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-semibold text-muted">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "amount_desc" | "amount_asc" | "title")}
              className="h-9 px-3 rounded-xl bg-surface-raised border border-border text-xs font-semibold text-foreground cursor-pointer focus:border-primary"
            >
              <option value="amount_desc">Tutar (Yüksekten Düşüğe)</option>
              <option value="amount_asc">Tutar (Düşükten Yükseğe)</option>
              <option value="title">İsim (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Arama ve Filtre Butonları */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-border">
          {/* Arama Input */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Kalem veya kart adı ara..."
              className="field w-full h-10 pl-9 pr-8 text-xs"
            />
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 w-5 h-5 flex items-center justify-center rounded-full text-muted hover:text-foreground cursor-pointer"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Kişi Filtresi */}
          <div className="md:col-span-5 flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-border text-xs font-semibold overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setPersonFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                personFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setPersonFilter("mert")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                personFilter === "mert"
                  ? "bg-sky-600 text-white shadow-2xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              👤 Mert
            </button>
            <button
              type="button"
              onClick={() => setPersonFilter("havsa")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                personFilter === "havsa"
                  ? "bg-pink-600 text-white shadow-2xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              👤 Havsa
            </button>
            <button
              type="button"
              onClick={() => setPersonFilter("ortak")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                personFilter === "ortak"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              🏠 Sadece Ortak
            </button>
          </div>

          {/* Tür Filtresi */}
          <div className="md:col-span-3 flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                typeFilter === "all" ? "bg-surface text-foreground font-bold shadow-2xs" : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Hepsi
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("kart")}
              className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                typeFilter === "kart" ? "bg-surface text-foreground font-bold shadow-2xs" : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Kart
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("bireysel")}
              className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                typeFilter === "bireysel" ? "bg-surface text-foreground font-bold shadow-2xs" : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Bireysel
            </button>
          </div>
        </div>
      </div>

      {/* Şeffaf Tablo Konteyneri */}
      <div className="ds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-muted uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Harcama / Kalem Adı</th>
                <th className="py-3 px-3">Ödeyen</th>
                <th className="py-3 px-3">Paylaşım Türü</th>
                <th className="py-3 px-3 text-right">Toplam Tutar</th>
                <th className="py-3 px-3 text-right text-sky-700">Mert Yükü</th>
                <th className="py-3 px-3 text-right text-pink-700">Havsa Yükü</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <span className="text-3xl block mb-2">🔍</span>
                    <span className="font-bold text-foreground">Filtreye uygun harcama kaydı bulunamadı.</span>
                    <span className="block text-xs mt-1">Filtreleri sıfırlayarak tekrar deneyin.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const orijinalKart = item.orijinalKartId
                    ? veri.krediKartlari.find((k) => k.id === item.orijinalKartId)
                    : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-raised/70 transition group"
                    >
                      {/* Başlık ve Detay */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base shrink-0">
                            {item.tur === "transfer"
                              ? "💸"
                              : item.tur === "ayri_harcama"
                              ? "🛍️"
                              : item.tur === "bireysel_kalem"
                              ? "🏷️"
                              : orijinalKart?.kayitTipi === "harcama"
                              ? "🧾"
                              : "💳"}
                          </span>
                          <div>
                            <span className="font-bold text-foreground block group-hover:text-primary transition-colors">
                              {item.ad}
                            </span>
                            {item.detay && (
                              <span className="text-[11px] text-muted block">
                                {item.detay}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kimin Cebinden Çıktı */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.odeyen === "mert" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            👤 Mert
                          </span>
                        ) : item.odeyen === "havsa" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                            👤 Havsa
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Kime Ait / Paylaşım Türü */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.tur === "transfer" ? (
                          <span className="text-[10px] font-bold text-success bg-success-soft border border-success/25 px-2 py-0.5 rounded-md">
                            Borç Transferi
                          </span>
                        ) : item.kimeAit === "ortak" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-lavender text-primary border border-border-lavender">
                            🏠 Ortak (50/50)
                          </span>
                        ) : item.kimeAit === "mert" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            👤 Mert&apos;in Bireyseli
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                            👤 Havsa&apos;nın Bireyseli
                          </span>
                        )}
                      </td>

                      {/* Toplam Tutar */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                        {para(item.tutar)}
                      </td>

                      {/* Mert Yükü */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-sky-700 whitespace-nowrap">
                        {item.mertYuku > 0 ? para(item.mertYuku) : "—"}
                      </td>

                      {/* Havsa Yükü */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-pink-700 whitespace-nowrap">
                        {item.havsaYuku > 0 ? para(item.havsaYuku) : "—"}
                      </td>

                      {/* Hızlı İşlemler */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.tur === "kart" && orijinalKart ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onKartDuzenle(orijinalKart)}
                              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
                              title="Kartı düzenle"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onKartSil(orijinalKart.id)}
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft cursor-pointer"
                              title="Kartı sil"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : item.tur === "ayri_harcama" ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const h = veri.bireyselAyriHarcamalar.find(
                                  (x) => `ayri-${x.id}` === item.id
                                );
                                if (h) onAyriHarcamaDuzenle(h);
                              }}
                              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
                              title="Düzenle"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const rawId = item.id.replace("ayri-", "");
                                onAyriHarcamaSil(rawId);
                              }}
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft cursor-pointer"
                              title="Sil"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : item.tur === "transfer" ? (
                          <button
                            type="button"
                            onClick={() => {
                              const rawId = item.id.replace("tr-", "");
                              onTransferSil(rawId);
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft cursor-pointer"
                            title="Transferi sil"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        ) : item.tur === "bireysel_kalem" && orijinalKart ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const bk = orijinalKart.bireyselKalemler.find(
                                  (x) => x.id === item.orijinalKalemId
                                );
                                if (bk) {
                                  onBireyselKalemDuzenle?.(orijinalKart.id, orijinalKart.ad, bk);
                                }
                              }}
                              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
                              title="Kalemi düzenle"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.orijinalKalemId) {
                                  onBireyselKalemSil?.(orijinalKart.id, item.orijinalKalemId);
                                }
                              }}
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft cursor-pointer"
                              title="Kalemi sil"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted">Kart Alt Kalemi</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TABLO ALTI TOPLAMLARI (RECONCILIATION FOOTER) */}
            {filteredItems.length > 0 && (
              <tfoot className="border-t-2 border-border bg-surface-raised font-bold text-xs">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 text-foreground">
                    <span className="uppercase text-[11px] tracking-wider text-muted mr-2">
                      Filtrelenen Toplamlar:
                    </span>
                    <span className="text-[11px] text-foreground-secondary font-normal">
                      (Mert Ödedi: {para(totals.mertOdedi)} | Havsa Ödedi: {para(totals.havsaOdedi)})
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-foreground">
                    {para(totals.toplamTutar)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-sky-700">
                    {para(totals.mertYuku)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-pink-700">
                    {para(totals.havsaYuku)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-success font-mono text-[11px]">
                    ✓ Dengede
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
