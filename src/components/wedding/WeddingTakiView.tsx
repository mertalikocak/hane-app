"use client";

import { useState, useMemo, useEffect } from "react";
import {
  WeddingTakiEventType,
  WeddingTakiAssetType,
  WeddingTakiGoldSubType,
  WeddingTakiEventDates,
  WeddingTakiItem,
  GoldPricesResponse,
} from "@/domain/weddingTypes";
import {
  updateWeddingTakiEventDate,
  addWeddingTaki,
  updateWeddingTaki,
  deleteWeddingTaki,
  calculateTakiItemValuation,
} from "@/storage/weddingStorage";
import { DEFAULT_FALLBACK_FOREX } from "@/services/clientGoldPriceService";
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
} from "@/components/ui/Icons";

interface WeddingTakiViewProps {
  takilar: WeddingTakiItem[];
  etkinlikTarihleri: WeddingTakiEventDates;
  goldPrices?: GoldPricesResponse | null;
  isPricesLoading?: boolean;
  onRefreshPrices?: () => void;
  onDataChange: () => void;
}

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);

const paraHassas = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

const sayiFormat = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(n);

const ETKINLIK_META: Record<
  WeddingTakiEventType,
  { label: string; icon: string; badgeClass: string }
> = {
  nisan: {
    label: "Nişan",
    icon: "💍",
    badgeClass: "bg-pink-500/10 text-pink-800 border-pink-500/25",
  },
  kina: {
    label: "Kına",
    icon: "💃",
    badgeClass: "bg-rose-500/10 text-rose-800 border-rose-500/25",
  },
  dugun: {
    label: "Düğün",
    icon: "👰🤵",
    badgeClass: "bg-amber-500/10 text-amber-900 border-amber-500/30",
  },
};

const ALTIN_TURU_META: Record<
  WeddingTakiGoldSubType,
  { label: string; icon: string; step: string }
> = {
  gram: { label: "Gram", icon: "🪙", step: "0.01" },
  ceyrek: { label: "Çeyrek", icon: "🟡", step: "1" },
  yarim: { label: "Yarım", icon: "🟠", step: "1" },
  tam: { label: "Tam", icon: "👑", step: "1" },
  ajda: { label: "Ajda", icon: "✨", step: "1" },
  diger: { label: "Diğer", icon: "🏺", step: "1" },
};

interface HistoricalRatesState {
  date: string;
  usd: number;
  eur: number;
  gram: number;
}

function getLiveUnitRate(
  takiTuru: WeddingTakiAssetType,
  altinTuru: WeddingTakiGoldSubType,
  goldPrices?: GoldPricesResponse | null
): number {
  if (takiTuru === "tl") return 1;
  if (takiTuru === "usd") {
    return Number(goldPrices?.dovizKurlari?.usd) || DEFAULT_FALLBACK_FOREX.usd;
  }
  if (takiTuru === "eur") {
    return Number(goldPrices?.dovizKurlari?.eur) || DEFAULT_FALLBACK_FOREX.eur;
  }
  if (altinTuru === "ceyrek") return Number(goldPrices?.kalemler?.ceyrek?.alis) || 0;
  if (altinTuru === "yarim") return Number(goldPrices?.kalemler?.yarim?.alis) || 0;
  if (altinTuru === "tam") return Number(goldPrices?.kalemler?.tam?.alis) || 0;
  if (altinTuru === "gram" || altinTuru === "ajda") {
    return Number(goldPrices?.kalemler?.gram?.alis) || 0;
  }
  return 0;
}

function getHistoricalUnitRate(
  takiTuru: WeddingTakiAssetType,
  altinTuru: WeddingTakiGoldSubType,
  historicalRates: HistoricalRatesState | null,
  goldPrices?: GoldPricesResponse | null
): number {
  if (!historicalRates) return 0;
  if (takiTuru === "tl") return 1;
  if (takiTuru === "usd") return historicalRates.usd;
  if (takiTuru === "eur") return historicalRates.eur;

  const histGram = historicalRates.gram;
  if (histGram <= 0) return 0;

  if (altinTuru === "gram" || altinTuru === "ajda") return histGram;

  const liveGram = Number(goldPrices?.kalemler?.gram?.alis) || 0;
  const liveCeyrek = Number(goldPrices?.kalemler?.ceyrek?.alis) || 0;
  const liveYarim = Number(goldPrices?.kalemler?.yarim?.alis) || 0;
  const liveTam = Number(goldPrices?.kalemler?.tam?.alis) || 0;

  if (altinTuru === "ceyrek") {
    const ratio = liveGram > 0 && liveCeyrek > 0 ? liveCeyrek / liveGram : 1.635;
    return Math.round(histGram * ratio);
  }
  if (altinTuru === "yarim") {
    const ratio = liveGram > 0 && liveYarim > 0 ? liveYarim / liveGram : 3.27;
    return Math.round(histGram * ratio);
  }
  if (altinTuru === "tam") {
    const ratio = liveGram > 0 && liveTam > 0 ? liveTam / liveGram : 6.54;
    return Math.round(histGram * ratio);
  }
  return 0;
}

export function WeddingTakiView({
  takilar,
  etkinlikTarihleri,
  goldPrices,
  isPricesLoading,
  onRefreshPrices,
  onDataChange,
}: WeddingTakiViewProps) {
  // Varsayılan açılan sekme: Düğün
  const [activeEvent, setActiveEvent] = useState<WeddingTakiEventType>("dugun");

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kimTakti, setKimTakti] = useState("");
  const [takiTuru, setTakiTuru] = useState<WeddingTakiAssetType>("altin");
  const [altinTuru, setAltinTuru] = useState<WeddingTakiGoldSubType>("ceyrek");
  const [digerAciklama, setDigerAciklama] = useState("");
  const [adetStr, setAdetStr] = useState("1");
  const [gramajStr, setGramajStr] = useState("10");
  const [birimKurStr, setBirimKurStr] = useState("");
  const [manuelDigerFiyatStr, setManuelDigerFiyatStr] = useState("");
  const [digerRefGramKurStr, setDigerRefGramKurStr] = useState("");
  const [notlar, setNotlar] = useState("");
  const [formHata, setFormHata] = useState<string | null>(null);

  // Filtreler
  const [turFiltresi, setTurFiltresi] = useState<"tum" | WeddingTakiAssetType>("tum");
  const [arama, setArama] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Seçili etkinlik tarihine ait geçmiş kurlar
  const [historicalRates, setHistoricalRates] = useState<HistoricalRatesState | null>(null);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  const liveUsd = Number(goldPrices?.dovizKurlari?.usd) || DEFAULT_FALLBACK_FOREX.usd;
  const liveEur = Number(goldPrices?.dovizKurlari?.eur) || DEFAULT_FALLBACK_FOREX.eur;
  const liveGram = Number(goldPrices?.kalemler?.gram?.alis) || 0;

  const activeEventDate = etkinlikTarihleri?.[activeEvent] || "";

  // Etkinlik tarihi geçmiş bir tarih ise o günün kurlarını getir
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (!activeEventDate || !/^\d{4}-\d{2}-\d{2}$/.test(activeEventDate) || activeEventDate >= todayStr) {
      setHistoricalRates(null);
      setHistoricalError(null);
      setIsHistoricalLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsHistoricalLoading(true);
    setHistoricalError(null);

    fetch(`/api/historical-rates?date=${encodeURIComponent(activeEventDate)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.isHistorical && json?.rates) {
          setHistoricalRates({
            date: json.date || activeEventDate,
            usd: Number(json.rates.usd) || 0,
            eur: Number(json.rates.eur) || 0,
            gram: Number(json.rates.gram) || 0,
          });
        } else {
          setHistoricalRates(null);
          if (json?.error) setHistoricalError(json.error);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setHistoricalRates(null);
          setHistoricalError("Geçmiş kur bilgisi alınamadı.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsHistoricalLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeEventDate]);

  // Yeni giriş modundayken tür, alt tür veya tarih kuru değiştiğinde o tarihin kurunu öner
  useEffect(() => {
    if (editingId) return;
    if (takiTuru === "altin" && altinTuru === "diger") {
      const refGram = historicalRates?.gram && historicalRates.gram > 0 ? historicalRates.gram : liveGram;
      if (refGram > 0) {
        setDigerRefGramKurStr(String(Math.round(refGram)));
      }
      return;
    }

    const histSuggested = getHistoricalUnitRate(takiTuru, altinTuru, historicalRates, goldPrices);
    const suggested =
      histSuggested > 0 ? histSuggested : getLiveUnitRate(takiTuru, altinTuru, goldPrices);

    if (suggested > 0) {
      setBirimKurStr(
        takiTuru === "usd" || takiTuru === "eur"
          ? String(Number(suggested.toFixed(2)))
          : String(Math.round(suggested))
      );
    }
  }, [takiTuru, altinTuru, goldPrices, historicalRates, editingId, liveGram]);

  const eventCounts = useMemo(() => {
    return {
      nisan: takilar.filter((t) => t.etkinlik === "nisan").length,
      kina: takilar.filter((t) => t.etkinlik === "kina").length,
      dugun: takilar.filter((t) => t.etkinlik === "dugun").length,
    };
  }, [takilar]);

  const etkinlikTakilari = useMemo(() => {
    return takilar.filter((t) => t.etkinlik === activeEvent);
  }, [takilar, activeEvent]);

  // Seçili etkinlik ve genel değerlendirme özeti
  const { eventSummary, globalSummary } = useMemo(() => {
    const createAgg = () => ({
      tarihToplamTL: 0,
      guncelToplamTL: 0,
      gramMiktar: 0,
      ceyrekAdet: 0,
      yarimAdet: 0,
      tamAdet: 0,
      ajdaAdet: 0,
      ajdaToplamGram: 0,
      digerAltinAdet: 0,
      usdToplam: 0,
      eurToplam: 0,
      tlToplam: 0,
    });

    const evAgg = createAgg();
    const glAgg = createAgg();

    for (const item of takilar) {
      const val = calculateTakiItemValuation(item, goldPrices);
      const targets = item.etkinlik === activeEvent ? [evAgg, glAgg] : [glAgg];

      for (const agg of targets) {
        agg.tarihToplamTL += val.tarihToplamDegerTL;
        agg.guncelToplamTL += val.guncelToplamDegerTL;

        if (item.takiTuru === "tl") {
          agg.tlToplam += item.tarihToplamDegerTL;
        } else if (item.takiTuru === "usd") {
          agg.usdToplam += Number(item.adet) || 0;
        } else if (item.takiTuru === "eur") {
          agg.eurToplam += Number(item.adet) || 0;
        } else if (item.takiTuru === "altin") {
          const st = item.altinTuru || "gram";
          if (st === "gram") agg.gramMiktar += Number(item.adet) || 0;
          else if (st === "ceyrek") agg.ceyrekAdet += Number(item.adet) || 0;
          else if (st === "yarim") agg.yarimAdet += Number(item.adet) || 0;
          else if (st === "tam") agg.tamAdet += Number(item.adet) || 0;
          else if (st === "ajda") {
            agg.ajdaAdet += Number(item.adet) || 0;
            agg.ajdaToplamGram += (Number(item.adet) || 1) * (Number(item.gramaj) || 0);
          } else if (st === "diger") {
            agg.digerAltinAdet += Number(item.adet) || 1;
          }
        }
      }
    }

    const finalize = (agg: ReturnType<typeof createAgg>) => {
      const farkTL = agg.guncelToplamTL - agg.tarihToplamTL;
      const farkYuzde = agg.tarihToplamTL > 0 ? (farkTL / agg.tarihToplamTL) * 100 : 0;
      return { ...agg, farkTL, farkYuzde };
    };

    return {
      eventSummary: finalize(evAgg),
      globalSummary: finalize(glAgg),
    };
  }, [takilar, activeEvent, goldPrices]);

  const filtrelenmisTakilar = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return etkinlikTakilari.filter((t) => {
      if (turFiltresi !== "tum" && t.takiTuru !== turFiltresi) return false;
      if (q) {
        const isimMatch = t.kimTakti.toLowerCase().includes(q);
        const descMatch = t.digerAltinAciklama?.toLowerCase().includes(q);
        const noteMatch = t.notlar?.toLowerCase().includes(q);
        if (!isimMatch && !descMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [etkinlikTakilari, turFiltresi, arama]);

  // Form canlı hesap önizlemesi
  const formPreview = useMemo(() => {
    const parsedAdet = parseFloat(adetStr.replace(",", ".")) || 0;
    const parsedGramaj = parseFloat(gramajStr.replace(",", ".")) || 0;
    const parsedBirimKur = parseFloat(birimKurStr.replace(",", ".")) || 0;
    const parsedManuelFiyat = parseFloat(manuelDigerFiyatStr.replace(",", ".")) || 0;
    const parsedRefGramKur = parseFloat(digerRefGramKurStr.replace(",", ".")) || 0;

    let tarihBirimFiyatTL = parsedBirimKur;
    let tarihToplamDegerTL = 0;

    if (takiTuru === "tl") {
      tarihBirimFiyatTL = 1;
      tarihToplamDegerTL = parsedAdet;
    } else if (takiTuru === "usd" || takiTuru === "eur") {
      tarihToplamDegerTL = parsedAdet * parsedBirimKur;
    } else if (takiTuru === "altin") {
      if (altinTuru === "ajda") {
        tarihToplamDegerTL = parsedAdet * parsedGramaj * parsedBirimKur;
      } else if (altinTuru === "diger") {
        tarihBirimFiyatTL = parsedManuelFiyat;
        tarihToplamDegerTL = parsedManuelFiyat;
      } else {
        tarihToplamDegerTL = parsedAdet * parsedBirimKur;
      }
    }

    const previewItem: WeddingTakiItem = {
      id: "preview",
      etkinlik: activeEvent,
      kimTakti: kimTakti || "Önizleme",
      takiTuru,
      altinTuru: takiTuru === "altin" ? altinTuru : undefined,
      digerAltinAciklama: digerAciklama,
      adet: takiTuru === "altin" && altinTuru === "diger" ? 1 : parsedAdet,
      gramaj: takiTuru === "altin" && altinTuru === "ajda" ? parsedGramaj : undefined,
      tarihBirimFiyatTL,
      tarihToplamDegerTL,
      tarihGramAltinKuruTL:
        takiTuru === "altin" && altinTuru === "diger" && parsedRefGramKur > 0
          ? parsedRefGramKur
          : undefined,
      tarih: activeEventDate || new Date().toISOString().split("T")[0],
      createdAt: "",
    };

    const valuation = calculateTakiItemValuation(previewItem, goldPrices);
    return {
      ...previewItem,
      valuation,
    };
  }, [
    adetStr,
    gramajStr,
    birimKurStr,
    manuelDigerFiyatStr,
    digerRefGramKurStr,
    takiTuru,
    altinTuru,
    digerAciklama,
    activeEvent,
    activeEventDate,
    kimTakti,
    goldPrices,
  ]);

  const handleEventDateChange = (newDate: string) => {
    updateWeddingTakiEventDate(activeEvent, newDate);
    onDataChange();
  };

  const resetForm = (keepEvent = true) => {
    setEditingId(null);
    setKimTakti("");
    setTakiTuru("altin");
    setAltinTuru("ceyrek");
    setDigerAciklama("");
    setAdetStr("1");
    setGramajStr("10");
    setManuelDigerFiyatStr("");
    setDigerRefGramKurStr(liveGram > 0 ? String(Math.round(liveGram)) : "");
    setNotlar("");
    setFormHata(null);
    if (keepEvent) {
      const rate = getLiveUnitRate("altin", "ceyrek", goldPrices);
      setBirimKurStr(rate > 0 ? String(Math.round(rate)) : "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormHata(null);

    const temizKim = kimTakti.trim();
    if (!temizKim) {
      setFormHata("Lütfen takıyı takan kişiyi yazın (örn: Halam).");
      return;
    }

    if (takiTuru === "altin" && altinTuru === "ajda") {
      if ((Number(formPreview.gramaj) || 0) <= 0) {
        setFormHata("Ajda bilezik için gramaj bilgisi 0'dan büyük olmalıdır.");
        return;
      }
      if (formPreview.adet <= 0) {
        setFormHata("Adet en az 1 olmalıdır.");
        return;
      }
      if (formPreview.tarihBirimFiyatTL <= 0) {
        setFormHata("Lütfen o tarihteki gram altın kurunu girin.");
        return;
      }
    } else if (takiTuru === "altin" && altinTuru === "diger") {
      if (formPreview.tarihToplamDegerTL <= 0) {
        setFormHata("Diğer altın türü için lütfen elle bir fiyat (TL) girin.");
        return;
      }
    } else if (takiTuru === "tl") {
      if (formPreview.tarihToplamDegerTL <= 0) {
        setFormHata("Lütfen TL tutarını girin.");
        return;
      }
    } else {
      if (formPreview.adet <= 0) {
        setFormHata("Miktar / adet 0'dan büyük olmalıdır.");
        return;
      }
      if (formPreview.tarihBirimFiyatTL <= 0) {
        setFormHata("Lütfen o tarihteki birim fiyatı / kuru girin.");
        return;
      }
    }

    const payload: Omit<WeddingTakiItem, "id" | "createdAt"> = {
      etkinlik: activeEvent,
      kimTakti: temizKim,
      takiTuru,
      altinTuru: takiTuru === "altin" ? altinTuru : undefined,
      digerAltinAciklama:
        takiTuru === "altin" && altinTuru === "diger" && digerAciklama.trim()
          ? digerAciklama.trim()
          : undefined,
      adet: formPreview.adet,
      gramaj: formPreview.gramaj,
      tarihBirimFiyatTL: formPreview.tarihBirimFiyatTL,
      tarihToplamDegerTL: formPreview.tarihToplamDegerTL,
      tarihGramAltinKuruTL: formPreview.tarihGramAltinKuruTL,
      tarih: activeEventDate || new Date().toISOString().split("T")[0],
      notlar: notlar.trim() || undefined,
    };

    if (editingId) {
      updateWeddingTaki(editingId, payload);
    } else {
      addWeddingTaki(payload);
    }

    onDataChange();
    resetForm();
  };

  const handleEdit = (item: WeddingTakiItem) => {
    setEditingId(item.id);
    setActiveEvent(item.etkinlik);
    setKimTakti(item.kimTakti);
    setTakiTuru(item.takiTuru);
    setAltinTuru(item.altinTuru || "ceyrek");
    setDigerAciklama(item.digerAltinAciklama || "");
    setAdetStr(String(item.adet || 1));
    setGramajStr(String(item.gramaj || 10));
    setBirimKurStr(String(item.tarihBirimFiyatTL || ""));
    setManuelDigerFiyatStr(
      item.takiTuru === "altin" && item.altinTuru === "diger"
        ? String(item.tarihToplamDegerTL || "")
        : ""
    );
    setDigerRefGramKurStr(
      item.tarihGramAltinKuruTL ? String(item.tarihGramAltinKuruTL) : ""
    );
    setNotlar(item.notlar || "");
    setFormHata(null);
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = (id: string) => {
    deleteWeddingTaki(id);
    setConfirmDeleteId(null);
    if (editingId === id) {
      resetForm();
    }
    onDataChange();
  };

  const fillLiveRateIntoForm = () => {
    if (takiTuru === "altin" && altinTuru === "diger") {
      if (liveGram > 0) setDigerRefGramKurStr(String(Math.round(liveGram)));
      return;
    }
    const rate = getLiveUnitRate(takiTuru, altinTuru, goldPrices);
    if (rate > 0) {
      setBirimKurStr(
        takiTuru === "usd" || takiTuru === "eur"
          ? String(Number(rate.toFixed(2)))
          : String(Math.round(rate))
      );
    }
  };

  const fillHistoricalRateIntoForm = () => {
    if (!historicalRates) return;
    if (takiTuru === "altin" && altinTuru === "diger") {
      if (historicalRates.gram > 0) {
        setDigerRefGramKurStr(String(Math.round(historicalRates.gram)));
      }
      return;
    }
    const rate = getHistoricalUnitRate(takiTuru, altinTuru, historicalRates, goldPrices);
    if (rate > 0) {
      setBirimKurStr(
        takiTuru === "usd" || takiTuru === "eur"
          ? String(Number(rate.toFixed(2)))
          : String(Math.round(rate))
      );
    }
  };

  const handleApplyHistoricalRatesToEventItems = () => {
    if (!historicalRates || etkinlikTakilari.length === 0) return;
    for (const item of etkinlikTakilari) {
      if (item.takiTuru === "tl") continue;
      if (item.takiTuru === "altin" && item.altinTuru === "diger") {
        if (historicalRates.gram > 0) {
          updateWeddingTaki(item.id, {
            tarihGramAltinKuruTL: Math.round(historicalRates.gram),
            tarih: activeEventDate || item.tarih,
          });
        }
        continue;
      }
      const histRate = getHistoricalUnitRate(
        item.takiTuru,
        item.altinTuru || "gram",
        historicalRates,
        goldPrices
      );
      if (histRate > 0) {
        const yeniBirim =
          item.takiTuru === "usd" || item.takiTuru === "eur"
            ? Number(histRate.toFixed(2))
            : Math.round(histRate);
        const yeniToplam =
          item.takiTuru === "altin" && item.altinTuru === "ajda"
            ? (Number(item.adet) || 1) * (Number(item.gramaj) || 0) * yeniBirim
            : (Number(item.adet) || 1) * yeniBirim;
        updateWeddingTaki(item.id, {
          tarihBirimFiyatTL: yeniBirim,
          tarihToplamDegerTL: yeniToplam,
          tarih: activeEventDate || item.tarih,
        });
      }
    }
    onDataChange();
  };

  const formatItemAssetLabel = (item: WeddingTakiItem) => {
    if (item.takiTuru === "tl") {
      return `₺ ${sayiFormat(item.tarihToplamDegerTL)} Nakit TL`;
    }
    if (item.takiTuru === "usd") {
      return `💵 $${sayiFormat(item.adet)} Dolar`;
    }
    if (item.takiTuru === "eur") {
      return `💶 €${sayiFormat(item.adet)} Euro`;
    }
    const st = item.altinTuru || "gram";
    if (st === "gram") return `🪙 ${sayiFormat(item.adet)} gr Gram Altın`;
    if (st === "ceyrek") return `🟡 ${sayiFormat(item.adet)} Adet Çeyrek Altın`;
    if (st === "yarim") return `🟠 ${sayiFormat(item.adet)} Adet Yarım Altın`;
    if (st === "tam") return `👑 ${sayiFormat(item.adet)} Adet Tam Altın`;
    if (st === "ajda") {
      return `✨ ${sayiFormat(item.adet)} Adet Ajda Bilezik (${sayiFormat(
        item.gramaj || 0
      )} gr)`;
    }
    return `🏺 ${item.digerAltinAciklama || "Diğer Altın"}`;
  };

  const liveRateForSelected = getLiveUnitRate(takiTuru, altinTuru, goldPrices);
  const historicalRateForSelected = getHistoricalUnitRate(
    takiTuru,
    altinTuru,
    historicalRates,
    goldPrices
  );

  return (
    <div className="space-y-6">
      {/* Üst Bar: 3 Etkinlik Alt Sekmesi (Nişan / Kına / Düğün - Default Düğün) & Etkinlik Tarihi */}
      <div className="ds-card p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-border self-start">
          {(["nisan", "kina", "dugun"] as WeddingTakiEventType[]).map((evKey) => {
            const meta = ETKINLIK_META[evKey];
            const isActive = activeEvent === evKey;
            return (
              <button
                key={evKey}
                type="button"
                onClick={() => {
                  setActiveEvent(evKey);
                  setConfirmDeleteId(null);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-surface text-foreground shadow-2xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-surface text-muted border border-border"
                  }`}
                >
                  {eventCounts[evKey]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Seçili Etkinlik Tarihi Elle Giriş */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="etkinlik-tarihi-input"
              className="text-xs font-bold text-muted whitespace-nowrap"
            >
              📅 {ETKINLIK_META[activeEvent].label} Tarihi:
            </label>
            <input
              id="etkinlik-tarihi-input"
              type="date"
              value={activeEventDate}
              onChange={(e) => handleEventDateChange(e.target.value)}
              className="field h-9 px-2.5 text-xs font-semibold w-auto"
            />
          </div>

          {onRefreshPrices && (
            <button
              type="button"
              onClick={onRefreshPrices}
              disabled={isPricesLoading}
              className="secondary-button h-9 px-3 text-xs font-semibold flex items-center gap-1.5"
              title="Canlı altın ve döviz kurlarını güncelle"
            >
              <span className={isPricesLoading ? "animate-spin inline-block" : ""}>🔄</span>
              <span className="hidden sm:inline">Kurları Güncelle</span>
            </button>
          )}
        </div>
      </div>

      {/* Canlı Kur & Seçili Tarih Kur Bilgi Şeridi */}
      <div className="space-y-1.5 px-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="font-bold text-foreground">Bugünkü Canlı Kurlar:</span>
          <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border tabular-nums">
            Gram Altın: <strong>{para(liveGram)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border tabular-nums">
            Çeyrek: <strong>{para(Number(goldPrices?.kalemler?.ceyrek?.alis) || 0)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border tabular-nums">
            USD: <strong>{paraHassas(liveUsd)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-border tabular-nums">
            EUR: <strong>{paraHassas(liveEur)}</strong>
          </span>
        </div>

        {(isHistoricalLoading || historicalRates || historicalError) && (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {isHistoricalLoading && (
              <span className="text-primary font-semibold animate-pulse">
                ⏳ {activeEventDate} tarihinin geçmiş kurları getiriliyor...
              </span>
            )}
            {!isHistoricalLoading && historicalRates && (
              <>
                <span className="font-bold text-primary">
                  🗓️ {historicalRates.date} Tarihi Kurları:
                </span>
                {historicalRates.gram > 0 && (
                  <>
                    <span className="px-2 py-0.5 rounded-md bg-accent/60 border border-border-lavender text-foreground tabular-nums">
                      Gram: <strong>{para(historicalRates.gram)}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-accent/60 border border-border-lavender text-foreground tabular-nums">
                      Çeyrek (~):{" "}
                      <strong>
                        {para(
                          getHistoricalUnitRate("altin", "ceyrek", historicalRates, goldPrices)
                        )}
                      </strong>
                    </span>
                  </>
                )}
                {historicalRates.usd > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-accent/60 border border-border-lavender text-foreground tabular-nums">
                    USD: <strong>{paraHassas(historicalRates.usd)}</strong>
                  </span>
                )}
                {historicalRates.eur > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-accent/60 border border-border-lavender text-foreground tabular-nums">
                    EUR: <strong>{paraHassas(historicalRates.eur)}</strong>
                  </span>
                )}
                {etkinlikTakilari.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyHistoricalRatesToEventItems}
                    className="px-2.5 py-0.5 rounded-md bg-primary text-white font-bold hover:opacity-90 transition cursor-pointer"
                  >
                    🔄 Mevcut Listeyi Bu Tarih Kuruyla Güncelle
                  </button>
                )}
              </>
            )}
            {!isHistoricalLoading && historicalError && (
              <span className="text-amber-700 font-semibold">
                ⚠️ {historicalError} Kuru elle girebilirsiniz.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Seçili Etkinlik Karşılaştırmalı Özet Kartları (Kumbara Tarzı) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* O Tarihteki Değer */}
        <div className="ds-card p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {ETKINLIK_META[activeEvent].label} — O Tarihteki Değer
            </span>
            <span className="text-lg">🗓️</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
            {para(eventSummary.tarihToplamTL)}
          </div>
          <div className="text-xs text-muted">
            Takıldığı tarihte girilen kurlarla toplam değeri
            {globalSummary.tarihToplamTL !== eventSummary.tarihToplamTL && (
              <span className="block text-[11px] text-primary font-semibold mt-0.5 tabular-nums">
                Tüm etkinlikler toplamı: {para(globalSummary.tarihToplamTL)}
              </span>
            )}
          </div>
        </div>

        {/* Günümüzdeki Güncel Değer */}
        <div className="ds-card-lavender p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {ETKINLIK_META[activeEvent].label} — Günümüzdeki Değer
            </span>
            <span className="text-xl">💎</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
            {para(eventSummary.guncelToplamTL)}
          </div>
          <div className="text-xs text-muted">
            Güncel altın & döviz kurlarıyla bugünkü değeri
            {globalSummary.guncelToplamTL !== eventSummary.guncelToplamTL && (
              <span className="block text-[11px] text-primary font-semibold mt-0.5 tabular-nums">
                Tüm etkinlikler bugünkü: {para(globalSummary.guncelToplamTL)}
              </span>
            )}
          </div>
        </div>

        {/* Değer Karşılaştırması / Artış */}
        <div className="ds-card p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Değer Farkı / Kazanç
            </span>
            <span className="text-lg">📈</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${
                eventSummary.farkTL >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {eventSummary.farkTL >= 0 ? "+" : ""}
              {para(eventSummary.farkTL)}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
                eventSummary.farkTL >= 0
                  ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/25"
                  : "bg-rose-500/15 text-rose-700 border border-rose-500/25"
              }`}
            >
              {eventSummary.farkTL >= 0 ? "+" : ""}
              {eventSummary.farkYuzde.toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-muted tabular-nums">
            {eventSummary.ceyrekAdet > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                🟡 {sayiFormat(eventSummary.ceyrekAdet)} Çeyrek
              </span>
            )}
            {eventSummary.yarimAdet > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                🟠 {sayiFormat(eventSummary.yarimAdet)} Yarım
              </span>
            )}
            {eventSummary.tamAdet > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                👑 {sayiFormat(eventSummary.tamAdet)} Tam
              </span>
            )}
            {eventSummary.gramMiktar > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                🪙 {sayiFormat(eventSummary.gramMiktar)} gr
              </span>
            )}
            {eventSummary.ajdaAdet > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                ✨ {sayiFormat(eventSummary.ajdaAdet)} Ajda ({sayiFormat(eventSummary.ajdaToplamGram)} gr)
              </span>
            )}
            {eventSummary.digerAltinAdet > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                🏺 {eventSummary.digerAltinAdet} Diğer Altın
              </span>
            )}
            {eventSummary.usdToplam > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                💵 ${sayiFormat(eventSummary.usdToplam)}
              </span>
            )}
            {eventSummary.eurToplam > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                💶 €{sayiFormat(eventSummary.eurToplam)}
              </span>
            )}
            {eventSummary.tlToplam > 0 && (
              <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">
                ₺ {sayiFormat(eventSummary.tlToplam)} TL
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Takı Giriş Formu */}
      <form onSubmit={handleSubmit} className="ds-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>{editingId ? "✏️" : "🎁"}</span>
            <span>
              {editingId
                ? "Takı Kaydını Düzenle"
                : `${ETKINLIK_META[activeEvent].label} İçin Takı Ekle`}
            </span>
          </h3>
          {activeEventDate && (
            <span className="text-[11px] font-semibold text-muted">
              Etkinlik Tarihi: {activeEventDate}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Kim Taktı */}
          <div className="lg:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
              Kim Taktı
            </label>
            <input
              type="text"
              placeholder="Örn: Halam"
              value={kimTakti}
              onChange={(e) => setKimTakti(e.target.value)}
              className="field h-10 px-3 text-sm"
            />
          </div>

          {/* Takı Ana Türü: Altın / Dolar / Euro / TL */}
          <div className="lg:col-span-8 space-y-1">
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
              Takı Türü
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: "altin", label: "Altın", icon: "🪙" },
                  { id: "usd", label: "Dolar", icon: "💵" },
                  { id: "eur", label: "Euro", icon: "💶" },
                  { id: "tl", label: "TL", icon: "₺" },
                ] as { id: WeddingTakiAssetType; label: string; icon: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTakiTuru(opt.id);
                    if (!editingId) {
                      setAdetStr(opt.id === "altin" ? "1" : "");
                      setNotlar("");
                    }
                    setFormHata(null);
                  }}
                  className={`h-10 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    takiTuru === opt.id
                      ? "bg-primary text-white border-primary shadow-2xs"
                      : "bg-surface-raised border-border text-muted hover:text-foreground"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Altın Seçenekleri */}
        {takiTuru === "altin" && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                Altın Çeşidi
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(
                  ["gram", "ceyrek", "yarim", "tam", "ajda", "diger"] as WeddingTakiGoldSubType[]
                ).map((sub) => {
                  const meta = ALTIN_TURU_META[sub];
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setAltinTuru(sub);
                        setFormHata(null);
                      }}
                      className={`h-9 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        altinTuru === sub
                          ? "bg-amber-500/20 border-amber-500 text-amber-900"
                          : "bg-surface-raised border-border text-muted hover:text-foreground"
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {altinTuru === "diger" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                    Altın Türü / Açıklama
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Trabzon Hasırı, Kolye..."
                    value={digerAciklama}
                    onChange={(e) => setDigerAciklama(e.target.value)}
                    className="field h-10 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                    Fiyatı (TL - Elle Giriş)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Örn: 45000"
                    value={manuelDigerFiyatStr}
                    onChange={(e) => setManuelDigerFiyatStr(e.target.value)}
                    className="field h-10 px-3 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                      O Günkü Gram Kuru (TL)
                    </label>
                    <div className="flex items-center gap-2">
                      {historicalRates && historicalRates.gram > 0 && (
                        <button
                          type="button"
                          onClick={fillHistoricalRateIntoForm}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Tarih: {para(historicalRates.gram)}
                        </button>
                      )}
                      {liveGram > 0 && (
                        <button
                          type="button"
                          onClick={fillLiveRateIntoForm}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Canlı: {para(liveGram)}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Boşsa TL sabit kalır"
                    value={digerRefGramKurStr}
                    onChange={(e) => setDigerRefGramKurStr(e.target.value)}
                    className="field h-10 px-3 text-sm tabular-nums"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                    {altinTuru === "gram" ? "Gram Miktarı" : "Adet"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={ALTIN_TURU_META[altinTuru].step}
                    value={adetStr}
                    onChange={(e) => setAdetStr(e.target.value)}
                    className="field h-10 px-3 text-sm tabular-nums"
                  />
                </div>

                {altinTuru === "ajda" && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                      Gramaj (gr / bilezik)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="Örn: 15"
                      value={gramajStr}
                      onChange={(e) => setGramajStr(e.target.value)}
                      className="field h-10 px-3 text-sm tabular-nums"
                    />
                  </div>
                )}

                <div className={`space-y-1 ${altinTuru === "ajda" ? "" : "sm:col-span-2"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                      {altinTuru === "ajda"
                        ? "O Tarihteki Gram Fiyatı (TL)"
                        : `O Tarihteki ${ALTIN_TURU_META[altinTuru].label} Kuru (TL)`}
                    </label>
                    <div className="flex items-center gap-2">
                      {historicalRateForSelected > 0 && (
                        <button
                          type="button"
                          onClick={fillHistoricalRateIntoForm}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Tarih Kuru: {para(historicalRateForSelected)}
                        </button>
                      )}
                      {liveRateForSelected > 0 && (
                        <button
                          type="button"
                          onClick={fillLiveRateIntoForm}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Canlı Kur: {para(liveRateForSelected)}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="O tarihteki birim TL değeri"
                    value={birimKurStr}
                    onChange={(e) => setBirimKurStr(e.target.value)}
                    className="field h-10 px-3 text-sm tabular-nums"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dolar / Euro Alanları */}
        {(takiTuru === "usd" || takiTuru === "eur") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                Miktar ({takiTuru === "usd" ? "$ Dolar" : "€ Euro"})
              </label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="Örn: 100"
                value={adetStr}
                onChange={(e) => setAdetStr(e.target.value)}
                className="field h-10 px-3 text-sm tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                  O Tarihteki Kur (TL)
                </label>
                <div className="flex items-center gap-2">
                  {historicalRateForSelected > 0 && (
                    <button
                      type="button"
                      onClick={fillHistoricalRateIntoForm}
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Tarih Kuru: {paraHassas(historicalRateForSelected)}
                    </button>
                  )}
                  {liveRateForSelected > 0 && (
                    <button
                      type="button"
                      onClick={fillLiveRateIntoForm}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Canlı Kur: {paraHassas(liveRateForSelected)}
                    </button>
                  )}
                </div>
              </div>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Örn: 38.50"
                value={birimKurStr}
                onChange={(e) => setBirimKurStr(e.target.value)}
                className="field h-10 px-3 text-sm tabular-nums"
              />
            </div>
          </div>
        )}

        {/* TL Alanı */}
        {takiTuru === "tl" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                Nakit Tutar (₺ TL)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="Örn: 5000"
                value={adetStr}
                onChange={(e) => setAdetStr(e.target.value)}
                className="field h-10 px-3 text-sm tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                Not (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: Zarf / Havale..."
                value={notlar}
                onChange={(e) => setNotlar(e.target.value)}
                className="field h-10 px-3 text-sm"
              />
            </div>
          </div>
        )}

        {/* Not & Canlı Karşılaştırma Önizlemesi & Gönder */}
        <div className="pt-2 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
            <div className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border">
              <span className="text-muted">O Günkü Değer: </span>
              <strong className="text-foreground">
                {para(formPreview.valuation.tarihToplamDegerTL)}
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-accent/60 border border-border-lavender">
              <span className="text-primary font-semibold">Günümüz Değeri: </span>
              <strong className="text-foreground">
                {para(formPreview.valuation.guncelToplamDegerTL)}
              </strong>
            </div>
            {formPreview.valuation.tarihToplamDegerTL > 0 && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  formPreview.valuation.farkTL >= 0
                    ? "bg-emerald-500/15 text-emerald-800"
                    : "bg-rose-500/15 text-rose-700"
                }`}
              >
                {formPreview.valuation.farkTL >= 0 ? "+" : ""}
                {para(formPreview.valuation.farkTL)} (
                {formPreview.valuation.farkTL >= 0 ? "+" : ""}
                {formPreview.valuation.farkYuzde.toFixed(1)}%)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {editingId && (
              <button
                type="button"
                onClick={() => resetForm()}
                className="secondary-button h-10 px-3 text-xs"
              >
                <CloseIcon size={14} />
                <span>İptal</span>
              </button>
            )}
            <button
              type="submit"
              className="primary-button h-10 px-5 text-xs font-bold"
            >
              <PlusIcon size={14} />
              <span>{editingId ? "Güncelle" : "Takıyı Kaydet"}</span>
            </button>
          </div>
        </div>

        {formHata && (
          <p className="text-xs text-rose-600 font-semibold">{formHata}</p>
        )}
      </form>

      {/* Filtre & Liste */}
      <div className="space-y-3">
        <div className="ds-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Kim taktı veya açıklama ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="field h-9 pl-8 pr-3 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-raised rounded-xl border border-border self-start sm:self-center">
            {(
              [
                { id: "tum", label: `Tümü (${etkinlikTakilari.length})` },
                { id: "altin", label: "Altın" },
                { id: "usd", label: "Dolar" },
                { id: "eur", label: "Euro" },
                { id: "tl", label: "TL" },
              ] as { id: "tum" | WeddingTakiAssetType; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTurFiltresi(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  turFiltresi === f.id
                    ? "bg-surface text-foreground shadow-2xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtrelenmisTakilar.length === 0 ? (
          <div className="ds-card border-dashed p-10 text-center space-y-2">
            <span className="text-3xl block">{ETKINLIK_META[activeEvent].icon}</span>
            <h4 className="text-sm font-bold text-foreground">
              {ETKINLIK_META[activeEvent].label} için henüz takı kaydı yok
            </h4>
            <p className="text-xs text-muted">
              Yukarıdaki formdan altın, dolar, euro veya TL takılarını ekleyip değer artışını takip edebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrelenmisTakilar.map((item) => {
              const val = calculateTakiItemValuation(item, goldPrices);
              return (
                <div
                  key={item.id}
                  className="ds-card flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 hover:border-border-strong transition"
                >
                  {/* Sol: Kim Taktı & Takı Detayı */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {item.kimTakti}
                      </span>
                      <span className="ds-badge ds-badge-neutral text-xs font-bold">
                        {formatItemAssetLabel(item)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                      {item.tarih && <span>📅 {item.tarih}</span>}
                      {item.takiTuru !== "tl" &&
                        !(item.takiTuru === "altin" && item.altinTuru === "diger") && (
                          <span className="tabular-nums">
                            • O günkü birim kur: {paraHassas(item.tarihBirimFiyatTL)}
                          </span>
                        )}
                      {item.notlar && <span>• {item.notlar}</span>}
                    </div>
                  </div>

                  {/* Sağ: Değer Karşılaştırması + Aksiyonlar */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                    <div className="flex items-center gap-3 sm:gap-4 tabular-nums">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-semibold text-muted uppercase">
                          O Tarihteki
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-foreground">
                          {para(val.tarihToplamDegerTL)}
                        </div>
                      </div>

                      <div className="text-muted text-xs">→</div>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-semibold text-primary uppercase">
                          Günümüzdeki
                        </div>
                        <div className="text-sm sm:text-base font-extrabold text-foreground">
                          {para(val.guncelToplamDegerTL)}
                        </div>
                      </div>

                      {item.takiTuru !== "tl" && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                            val.farkTL >= 0
                              ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-800"
                              : "bg-rose-500/15 border-rose-500/25 text-rose-700"
                          }`}
                        >
                          {val.farkTL >= 0 ? "+" : ""}
                          {para(val.farkTL)} ({val.farkTL >= 0 ? "+" : ""}
                          {val.farkYuzde.toFixed(1)}%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(item.id)}
                            className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-2.5 py-1 text-xs h-7 min-h-0"
                          >
                            Sil
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="secondary-button px-2.5 py-1 text-xs h-7 min-h-0"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="icon-button h-8 w-8"
                            title="Düzenle"
                          >
                            <EditIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="icon-button h-8 w-8 text-muted hover:text-rose-600"
                            title="Sil"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </>
                      )}
                    </div>
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
