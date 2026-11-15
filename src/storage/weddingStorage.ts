import {
  WeddingData,
  WeddingItem,
  WeddingPiggyContribution,
  WeddingStats,
  GoldPricesMap,
  GoldPricesResponse,
  GoldType,
  GoldSummaryItem,
  WeddingParticipant,
  WeddingParticipantSide,
  WeddingTakiEventType,
  WeddingTakiItem,
  WeddingTakiValuation,
} from "@/domain/weddingTypes";
import { queueLocalChangePush } from "@/lib/firebase/syncService";

export const WEDDING_STORAGE_KEY = "hane_wedding_data";
export const WEDDING_EVENT_NAME = "wedding_data_updated";

const BASLANGIC_MADDELER: Omit<WeddingItem, "id" | "createdAt">[] = [
  {
    baslik: "Düğün & Nikah Salonu Rezervasyonu",
    kategori: "mekan",
    tutar: 80000,
    tamamlandi: false,
    sorumluKisi: "ortak",
    notlar: "Mekan kaparo ve organizasyon anlaşması",
  },
  {
    baslik: "Gelinlik, Duvak & Aksesuarlar",
    kategori: "giyim",
    tutar: 35000,
    tamamlandi: false,
    sorumluKisi: "havsa",
    notlar: "Gelinlik provası ve aksesuarlar",
  },
  {
    baslik: "Damatlık & Ayakkabı",
    kategori: "giyim",
    tutar: 20000,
    tamamlandi: false,
    sorumluKisi: "mert",
    notlar: "Damatlık takımı, gömlek ve ayakkabı",
  },
  {
    baslik: "Fotoğraf & Dış Çekim & Video Hikayesi",
    kategori: "fotograf",
    tutar: 25000,
    tamamlandi: false,
    sorumluKisi: "ortak",
    notlar: "Tüm gün klip ve dış mekan çekimi",
  },
  {
    baslik: "Davetiyeler & Baskı",
    kategori: "davetiye",
    tutar: 4000,
    tamamlandi: false,
    sorumluKisi: "ortak",
    notlar: "Davetiye tasarımı ve baskısı",
  },
  {
    baslik: "Nikah Şekeri & Misafir Hediyelikleri",
    kategori: "davetiye",
    tutar: 5000,
    tamamlandi: false,
    sorumluKisi: "havsa",
    notlar: "Misafirlere dağıtılacak hediyelikler",
  },
  {
    baslik: "Gelin Saçı & Makyajı (Kuaför)",
    kategori: "giyim",
    tutar: 8000,
    tamamlandi: false,
    sorumluKisi: "havsa",
    notlar: "Prova ve düğün günü kuaför hazırlığı",
  },
  {
    baslik: "Gelin Çiçeği & Araç Süsleme",
    kategori: "mekan",
    tutar: 3500,
    tamamlandi: false,
    sorumluKisi: "mert",
    notlar: "El çiçeği ve araç konvoy süslemesi",
  },
  {
    baslik: "Balayı Rezervasyonu & Ulaşım",
    kategori: "balayi",
    tutar: 45000,
    tamamlandi: false,
    sorumluKisi: "ortak",
    notlar: "Otel konaklama ve uçak biletleri",
  },
];

export function bosWeddingVerisi(): WeddingData {
  const now = new Date().toISOString();
  return {
    kumbaraKatkilar: [],
    maddeler: BASLANGIC_MADDELER.map((m, idx) => ({
      ...m,
      id: `wed_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    })),
    katilimcilar: [],
    takiEtkinlikTarihleri: {
      nisan: "",
      kina: "",
      dugun: "",
    },
    takilar: [],
  };
}

export function getWeddingData(): WeddingData {
  if (typeof window === "undefined" || !window.localStorage) {
    return bosWeddingVerisi();
  }
  try {
    const raw = localStorage.getItem(WEDDING_STORAGE_KEY);
    if (!raw) {
      const initial = bosWeddingVerisi();
      localStorage.setItem(WEDDING_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);

    // Geriye dönük uyumluluk ve veri sağlama
    const rawKatkilar = Array.isArray(parsed.kumbaraKatkilar) ? parsed.kumbaraKatkilar : [];
    const normalizedKatkilar: WeddingPiggyContribution[] = rawKatkilar.map(
      (k: Partial<WeddingPiggyContribution>) => {
        const isGold = k.assetType === "gold";
        const miktar = isGold ? Number(k.miktar) || 0 : undefined;
        const birimAlisFiyati = isGold ? Number(k.birimAlisFiyati) || 0 : undefined;
        const toplamAlisMaliyeti = isGold
          ? Number(k.toplamAlisMaliyeti) || (miktar! * birimAlisFiyati!) || Number(k.tutar) || 0
          : undefined;

        return {
          id: k.id || `piggy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          assetType: isGold ? "gold" : "cash",
          ekleyenKisi: k.ekleyenKisi || "mert",
          ekleyenKisiAd: k.ekleyenKisiAd,
          tutar: Number(k.tutar) || (isGold ? (toplamAlisMaliyeti || 0) : 0),
          tarih: k.tarih || new Date().toISOString().split("T")[0],
          aciklama: k.aciklama,
          createdAt: k.createdAt || new Date().toISOString(),
          goldType: isGold ? k.goldType || "gram" : undefined,
          miktar,
          birimAlisFiyati,
          toplamAlisMaliyeti,
        };
      }
    );

    const rawKatilimcilar = Array.isArray(parsed.katilimcilar) ? parsed.katilimcilar : [];
    const normalizedKatilimcilar: WeddingParticipant[] = rawKatilimcilar.map(
      (p: Partial<WeddingParticipant>) => {
        const yetiskin = Math.max(0, Number(p.yetiskin) || 0);
        const cocuk = Math.max(0, Number(p.cocuk) || 0);
        return {
          id: p.id || `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          isim: p.isim || "",
          yetiskin,
          cocuk,
          toplam: yetiskin + cocuk,
          taraf: p.taraf === "havsa" ? "havsa" : "mert",
          createdAt: p.createdAt || new Date().toISOString(),
        };
      }
    );

    const rawTakilar = Array.isArray(parsed.takilar) ? parsed.takilar : [];
    const normalizedTakilar: WeddingTakiItem[] = rawTakilar.map(
      (t: Partial<WeddingTakiItem>) => {
        const etkinlik: WeddingTakiEventType =
          t.etkinlik === "nisan" || t.etkinlik === "kina" ? t.etkinlik : "dugun";
        const adet = Math.max(0, Number(t.adet) || 1);
        const gramaj = t.gramaj !== undefined ? Number(t.gramaj) || 0 : undefined;
        const tarihBirimFiyatTL = Number(t.tarihBirimFiyatTL) || 0;
        const tarihToplamDegerTL = Number(t.tarihToplamDegerTL) || 0;

        return {
          id: t.id || `taki_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          etkinlik,
          kimTakti: t.kimTakti || "",
          takiTuru:
            t.takiTuru === "usd" || t.takiTuru === "eur" || t.takiTuru === "tl"
              ? t.takiTuru
              : "altin",
          altinTuru: t.altinTuru,
          digerAltinAciklama: t.digerAltinAciklama,
          adet,
          gramaj,
          tarihBirimFiyatTL,
          tarihToplamDegerTL,
          tarihGramAltinKuruTL:
            t.tarihGramAltinKuruTL !== undefined ? Number(t.tarihGramAltinKuruTL) || 0 : undefined,
          tarih: t.tarih || new Date().toISOString().split("T")[0],
          notlar: t.notlar,
          createdAt: t.createdAt || new Date().toISOString(),
        };
      }
    );

    const rawTarihler = parsed.takiEtkinlikTarihleri || {};

    return {
      kumbaraKatkilar: normalizedKatkilar,
      maddeler: Array.isArray(parsed.maddeler) ? parsed.maddeler : [],
      hedefTarih: parsed.hedefTarih,
      notlar: parsed.notlar,
      katilimcilar: normalizedKatilimcilar,
      takiEtkinlikTarihleri: {
        nisan: typeof rawTarihler.nisan === "string" ? rawTarihler.nisan : "",
        kina: typeof rawTarihler.kina === "string" ? rawTarihler.kina : "",
        dugun: typeof rawTarihler.dugun === "string" ? rawTarihler.dugun : "",
      },
      takilar: normalizedTakilar,
    };
  } catch (err) {
    console.error("Wedding verisi okuma hatası:", err);
    return bosWeddingVerisi();
  }
}

export function saveWeddingData(data: WeddingData): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(WEDDING_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(WEDDING_EVENT_NAME));
    window.dispatchEvent(new Event("storage"));
    try {
      queueLocalChangePush(true);
    } catch {
      // ignore
    }
  } catch (err) {
    console.error("Wedding verisi kaydetme hatası:", err);
  }
}

export function addPiggyContribution(
  katki: Omit<WeddingPiggyContribution, "id" | "createdAt">
): WeddingPiggyContribution {
  const data = getWeddingData();
  const now = new Date().toISOString();
  const yeniKatki: WeddingPiggyContribution = {
    ...katki,
    id: `piggy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
  };
  data.kumbaraKatkilar.unshift(yeniKatki);
  saveWeddingData(data);
  return yeniKatki;
}

export function updatePiggyContribution(
  guncelKatki: WeddingPiggyContribution
): void {
  const data = getWeddingData();
  const idx = data.kumbaraKatkilar.findIndex((k) => k.id === guncelKatki.id);
  if (idx !== -1) {
    data.kumbaraKatkilar[idx] = guncelKatki;
    saveWeddingData(data);
  }
}

export function deletePiggyContribution(id: string): void {
  const data = getWeddingData();
  data.kumbaraKatkilar = data.kumbaraKatkilar.filter((k) => k.id !== id);
  saveWeddingData(data);
}

export function addWeddingItem(
  madde: Omit<WeddingItem, "id" | "createdAt">
): WeddingItem {
  const data = getWeddingData();
  const now = new Date().toISOString();
  const yeniMadde: WeddingItem = {
    ...madde,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
  };
  data.maddeler.unshift(yeniMadde);
  saveWeddingData(data);
  return yeniMadde;
}

export function updateWeddingItem(guncelMadde: WeddingItem): void {
  const data = getWeddingData();
  const idx = data.maddeler.findIndex((m) => m.id === guncelMadde.id);
  if (idx !== -1) {
    data.maddeler[idx] = guncelMadde;
    saveWeddingData(data);
  }
}

export function toggleWeddingItem(id: string): WeddingItem | null {
  const data = getWeddingData();
  const item = data.maddeler.find((m) => m.id === id);
  if (!item) return null;

  item.tamamlandi = !item.tamamlandi;
  item.tamamlanmaTarihi = item.tamamlandi ? new Date().toISOString() : undefined;
  saveWeddingData(data);
  return item;
}

export function deleteWeddingItem(id: string): void {
  const data = getWeddingData();
  data.maddeler = data.maddeler.filter((m) => m.id !== id);
  saveWeddingData(data);
}

// ==========================================
// KATILIMCILAR CRUD
// ==========================================

export function addWeddingParticipant(payload: {
  isim: string;
  yetiskin: number;
  cocuk: number;
  taraf: WeddingParticipantSide;
}): WeddingData {
  const data = getWeddingData();
  const yetiskin = Math.max(0, Math.round(Number(payload.yetiskin) || 0));
  const cocuk = Math.max(0, Math.round(Number(payload.cocuk) || 0));
  const yeniKatilimci: WeddingParticipant = {
    id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    isim: payload.isim.trim(),
    yetiskin,
    cocuk,
    toplam: yetiskin + cocuk,
    taraf: payload.taraf,
    createdAt: new Date().toISOString(),
  };
  data.katilimcilar = [yeniKatilimci, ...(data.katilimcilar || [])];
  saveWeddingData(data);
  return data;
}

export function updateWeddingParticipant(
  id: string,
  payload: Partial<Omit<WeddingParticipant, "id" | "createdAt">>
): WeddingData {
  const data = getWeddingData();
  const list = [...(data.katilimcilar || [])];
  const idx = list.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const existing = list[idx];
    const yetiskin =
      payload.yetiskin !== undefined
        ? Math.max(0, Math.round(Number(payload.yetiskin) || 0))
        : existing.yetiskin;
    const cocuk =
      payload.cocuk !== undefined
        ? Math.max(0, Math.round(Number(payload.cocuk) || 0))
        : existing.cocuk;
    list[idx] = {
      ...existing,
      ...payload,
      isim: payload.isim !== undefined ? payload.isim.trim() : existing.isim,
      yetiskin,
      cocuk,
      toplam: yetiskin + cocuk,
    };
    data.katilimcilar = list;
    saveWeddingData(data);
  }
  return data;
}

export function deleteWeddingParticipant(id: string): WeddingData {
  const data = getWeddingData();
  data.katilimcilar = (data.katilimcilar || []).filter((p) => p.id !== id);
  saveWeddingData(data);
  return data;
}

// ==========================================
// TAKI & HEDİYE CRUD + DEĞERLENDİRME
// ==========================================

export function updateWeddingTakiEventDate(
  etkinlik: WeddingTakiEventType,
  tarih: string
): WeddingData {
  const data = getWeddingData();
  data.takiEtkinlikTarihleri = {
    ...(data.takiEtkinlikTarihleri || {}),
    [etkinlik]: tarih,
  };
  saveWeddingData(data);
  return data;
}

export function addWeddingTaki(
  item: Omit<WeddingTakiItem, "id" | "createdAt">
): WeddingData {
  const data = getWeddingData();
  const yeniTaki: WeddingTakiItem = {
    ...item,
    id: `taki_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  data.takilar = [yeniTaki, ...(data.takilar || [])];
  saveWeddingData(data);
  return data;
}

export function updateWeddingTaki(
  id: string,
  updates: Partial<Omit<WeddingTakiItem, "id" | "createdAt">>
): WeddingData {
  const data = getWeddingData();
  const list = [...(data.takilar || [])];
  const idx = list.findIndex((t) => t.id === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...updates,
    };
    data.takilar = list;
    saveWeddingData(data);
  }
  return data;
}

export function deleteWeddingTaki(id: string): WeddingData {
  const data = getWeddingData();
  data.takilar = (data.takilar || []).filter((t) => t.id !== id);
  saveWeddingData(data);
  return data;
}

export function calculateTakiItemValuation(
  item: WeddingTakiItem,
  goldPrices?: GoldPricesResponse | null
): WeddingTakiValuation {
  const tarihToplamDegerTL = Number(item.tarihToplamDegerTL) || 0;
  let guncelBirimFiyatTL = Number(item.tarihBirimFiyatTL) || 0;
  let guncelToplamDegerTL = tarihToplamDegerTL;

  const liveGramAlis = Number(goldPrices?.kalemler?.gram?.alis) || 0;
  const liveCeyrekAlis = Number(goldPrices?.kalemler?.ceyrek?.alis) || 0;
  const liveYarimAlis = Number(goldPrices?.kalemler?.yarim?.alis) || 0;
  const liveTamAlis = Number(goldPrices?.kalemler?.tam?.alis) || 0;
  const liveUsd = Number(goldPrices?.dovizKurlari?.usd) || 0;
  const liveEur = Number(goldPrices?.dovizKurlari?.eur) || 0;

  if (item.takiTuru === "tl") {
    guncelBirimFiyatTL = 1;
    guncelToplamDegerTL = tarihToplamDegerTL;
  } else if (item.takiTuru === "usd") {
    guncelBirimFiyatTL = liveUsd > 0 ? liveUsd : Number(item.tarihBirimFiyatTL) || 0;
    guncelToplamDegerTL = (Number(item.adet) || 0) * guncelBirimFiyatTL;
  } else if (item.takiTuru === "eur") {
    guncelBirimFiyatTL = liveEur > 0 ? liveEur : Number(item.tarihBirimFiyatTL) || 0;
    guncelToplamDegerTL = (Number(item.adet) || 0) * guncelBirimFiyatTL;
  } else if (item.takiTuru === "altin") {
    const subType = item.altinTuru || "gram";
    if (subType === "gram") {
      guncelBirimFiyatTL = liveGramAlis > 0 ? liveGramAlis : Number(item.tarihBirimFiyatTL) || 0;
      guncelToplamDegerTL = (Number(item.adet) || 0) * guncelBirimFiyatTL;
    } else if (subType === "ceyrek") {
      guncelBirimFiyatTL =
        liveCeyrekAlis > 0 ? liveCeyrekAlis : Number(item.tarihBirimFiyatTL) || 0;
      guncelToplamDegerTL = (Number(item.adet) || 0) * guncelBirimFiyatTL;
    } else if (subType === "yarim") {
      guncelBirimFiyatTL = liveYarimAlis > 0 ? liveYarimAlis : Number(item.tarihBirimFiyatTL) || 0;
      guncelToplamDegerTL = (Number(item.adet) || 0) * guncelBirimFiyatTL;
    } else if (subType === "tam") {
      guncelBirimFiyatTL = liveTamAlis > 0 ? liveTamAlis : Number(item.tarihBirimFiyatTL) || 0;
      guncelToplamDegerTL = (Number(item.adet) || 0) * guncelBirimFiyatTL;
    } else if (subType === "ajda") {
      guncelBirimFiyatTL = liveGramAlis > 0 ? liveGramAlis : Number(item.tarihBirimFiyatTL) || 0;
      const totalGrams = (Number(item.adet) || 1) * (Number(item.gramaj) || 0);
      guncelToplamDegerTL = totalGrams * guncelBirimFiyatTL;
    } else if (subType === "diger") {
      const refGram = Number(item.tarihGramAltinKuruTL) || 0;
      if (refGram > 0 && liveGramAlis > 0) {
        guncelToplamDegerTL = (tarihToplamDegerTL / refGram) * liveGramAlis;
        guncelBirimFiyatTL =
          (Number(item.adet) || 1) > 0
            ? guncelToplamDegerTL / (Number(item.adet) || 1)
            : guncelToplamDegerTL;
      } else {
        guncelBirimFiyatTL = Number(item.tarihBirimFiyatTL) || tarihToplamDegerTL;
        guncelToplamDegerTL = tarihToplamDegerTL;
      }
    }
  }

  const farkTL = guncelToplamDegerTL - tarihToplamDegerTL;
  const farkYuzde = tarihToplamDegerTL > 0 ? (farkTL / tarihToplamDegerTL) * 100 : 0;

  return {
    tarihToplamDegerTL,
    guncelBirimFiyatTL,
    guncelToplamDegerTL,
    farkTL,
    farkYuzde,
  };
}

/**
 * Kumbara ve düğün istatistiklerini hesaplar.
 * Altınların güncel değeri Hesaplı Altın API'sinden gelen alış (bozdururken geçerli) fiyatıyla hesaplanır.
 */
export function getWeddingStats(
  data: WeddingData,
  goldPrices?: GoldPricesMap | null
): WeddingStats {
  let toplamNakitBiriken = 0;
  let toplamAltinGuncelDeger = 0;
  let toplamAltinAlisMaliyeti = 0;

  let mertBiriken = 0;
  let havsaBiriken = 0;
  let ortakBiriken = 0;
  let digerBiriken = 0;

  const toplamAltinAdetGram = {
    gram: 0,
    ceyrek: 0,
    yarim: 0,
    tam: 0,
  };

  const goldGroupCost: Record<GoldType, number> = {
    gram: 0,
    ceyrek: 0,
    yarim: 0,
    tam: 0,
  };

  for (const k of data.kumbaraKatkilar) {
    const isGold = k.assetType === "gold";

    if (!isGold) {
      // Nakit katkı
      const nakitTutar = Number(k.tutar) || 0;
      toplamNakitBiriken += nakitTutar;

      if (k.ekleyenKisi === "mert") mertBiriken += nakitTutar;
      else if (k.ekleyenKisi === "havsa") havsaBiriken += nakitTutar;
      else if (k.ekleyenKisi === "ortak") ortakBiriken += nakitTutar;
      else digerBiriken += nakitTutar;
    } else {
      // Altın katkı
      const goldType: GoldType = k.goldType || "gram";
      const miktar = Number(k.miktar) || 0;
      const unitBuyPrice = Number(k.birimAlisFiyati) || 0;
      const totalBuyCost =
        Number(k.toplamAlisMaliyeti) || (miktar * unitBuyPrice) || Number(k.tutar) || 0;

      // API'den gelen güncel piyasa ALIŞ (bozdururken kuyumcunun verdiği) fiyatı
      const currentUnitMarketPrice =
        goldPrices?.[goldType]?.alis && Number(goldPrices[goldType].alis) > 0
          ? Number(goldPrices[goldType].alis)
          : unitBuyPrice;

      const currentGoldValue = miktar * currentUnitMarketPrice;

      toplamAltinGuncelDeger += currentGoldValue;
      toplamAltinAlisMaliyeti += totalBuyCost;

      toplamAltinAdetGram[goldType] += miktar;
      goldGroupCost[goldType] += totalBuyCost;

      // Kişilere göre güncel değer dağılımı
      if (k.ekleyenKisi === "mert") mertBiriken += currentGoldValue;
      else if (k.ekleyenKisi === "havsa") havsaBiriken += currentGoldValue;
      else if (k.ekleyenKisi === "ortak") ortakBiriken += currentGoldValue;
      else digerBiriken += currentGoldValue;
    }
  }

  // Toplam biriken (Nakit + Altınların güncel TL değeri)
  const toplamBiriken = toplamNakitBiriken + toplamAltinGuncelDeger;
  const altinKarZararTL = toplamAltinGuncelDeger - toplamAltinAlisMaliyeti;
  const altinKarZararYuzde =
    toplamAltinAlisMaliyeti > 0 ? (altinKarZararTL / toplamAltinAlisMaliyeti) * 100 : 0;

  // 4 altın türünün her biri için özet analizi
  const goldTypesList: GoldType[] = ["gram", "ceyrek", "yarim", "tam"];
  const goldLabels: Record<GoldType, string> = {
    gram: "Gram Altın",
    ceyrek: "Çeyrek Altın",
    yarim: "Yarım Altın",
    tam: "Tam Altın",
  };

  const goldSummaries = {} as Record<GoldType, GoldSummaryItem>;

  for (const t of goldTypesList) {
    const miktar = toplamAltinAdetGram[t];
    const maliyet = goldGroupCost[t];
    const guncelBirim =
      goldPrices?.[t]?.alis && Number(goldPrices[t].alis) > 0
        ? Number(goldPrices[t].alis)
        : miktar > 0 && maliyet > 0
        ? maliyet / miktar
        : 0;
    const guncelToplam = miktar * guncelBirim;
    const karTL = guncelToplam - maliyet;
    const karYuzde = maliyet > 0 ? (karTL / maliyet) * 100 : 0;

    goldSummaries[t] = {
      goldType: t,
      etiket: goldLabels[t],
      miktar,
      birim: t === "gram" ? "gram" : "adet",
      toplamAlisMaliyeti: maliyet,
      guncelBirimAlisFiyati: guncelBirim,
      guncelToplamDeger: guncelToplam,
      karZararTL: karTL,
      karZararYuzde: karYuzde,
    };
  }

  // Harcamalar ve bütçe
  const harcananPara = data.maddeler
    .filter((m) => m.tamamlandi)
    .reduce((sum, m) => sum + (Number(m.tutar) || 0), 0);

  const kalanGerekenHarcama = data.maddeler
    .filter((m) => !m.tamamlandi)
    .reduce((sum, m) => sum + (Number(m.tutar) || 0), 0);

  const toplamGerekenButce = harcananPara + kalanGerekenHarcama;
  const kalanKumbara = toplamBiriken - harcananPara;

  const tamamlananSayisi = data.maddeler.filter((m) => m.tamamlandi).length;
  const toplamMaddeSayisi = data.maddeler.length;

  const tamamlanmaYuzdesi =
    toplamMaddeSayisi > 0 ? Math.round((tamamlananSayisi / toplamMaddeSayisi) * 100) : 0;

  const kumbaraKarsilamaYuzdesi =
    toplamGerekenButce > 0
      ? Math.min(100, Math.round((toplamBiriken / toplamGerekenButce) * 100))
      : 0;

  return {
    toplamBiriken,
    toplamNakitBiriken,
    toplamAltinGuncelDeger,
    toplamAltinAlisMaliyeti,
    altinKarZararTL,
    altinKarZararYuzde,
    mertBiriken,
    havsaBiriken,
    ortakBiriken,
    digerBiriken,
    harcananPara,
    kalanKumbara,
    kalanGerekenHarcama,
    toplamGerekenButce,
    tamamlananSayisi,
    toplamMaddeSayisi,
    tamamlanmaYuzdesi,
    kumbaraKarsilamaYuzdesi,
    goldSummaries,
    toplamAltinAdetGram,
  };
}
