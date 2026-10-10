import {
  WeddingData,
  WeddingItem,
  WeddingPiggyContribution,
  WeddingStats,
} from "@/domain/weddingTypes";

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
    return {
      kumbaraKatkilar: Array.isArray(parsed.kumbaraKatkilar) ? parsed.kumbaraKatkilar : [],
      maddeler: Array.isArray(parsed.maddeler) ? parsed.maddeler : [],
      hedefTarih: parsed.hedefTarih,
      notlar: parsed.notlar,
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

export function getWeddingStats(data: WeddingData): WeddingStats {
  const toplamBiriken = data.kumbaraKatkilar.reduce((sum, k) => sum + (Number(k.tutar) || 0), 0);
  const mertBiriken = data.kumbaraKatkilar
    .filter((k) => k.ekleyenKisi === "mert")
    .reduce((sum, k) => sum + (Number(k.tutar) || 0), 0);
  const havsaBiriken = data.kumbaraKatkilar
    .filter((k) => k.ekleyenKisi === "havsa")
    .reduce((sum, k) => sum + (Number(k.tutar) || 0), 0);
  const digerBiriken = data.kumbaraKatkilar
    .filter((k) => k.ekleyenKisi === "diger")
    .reduce((sum, k) => sum + (Number(k.tutar) || 0), 0);

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
    mertBiriken,
    havsaBiriken,
    digerBiriken,
    harcananPara,
    kalanKumbara,
    kalanGerekenHarcama,
    toplamGerekenButce,
    tamamlananSayisi,
    toplamMaddeSayisi,
    tamamlanmaYuzdesi,
    kumbaraKarsilamaYuzdesi,
  };
}
