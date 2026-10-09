import type {
  TaksitKarti,
  TaksitKalemi,
  TaksitVadeHesabi,
} from "@/domain/taksitTypes";

export const STORAGE_KEY_TAKSiT_KARTLARI = "hane_taksit_kartlari";
export const STORAGE_KEY_TAKSiTLER = "hane_taksitler";
export const TAKSiT_UPDATED_EVENT = "hane-taksit:updated";

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TAKSiT_UPDATED_EVENT));
    window.dispatchEvent(new Event("storage"));
  }
}

// ------------------------------------------------------------------
// KARTLAR (CREDIT CARDS)
// ------------------------------------------------------------------

const VARSAYILAN_KARTLAR: TaksitKarti[] = [
  {
    id: "kart_garanti_bonus",
    ad: "Garanti BBVA Bonus",
    banka: "Garanti BBVA",
    ekstreGunu: 15,
    sonOdemeGunu: 25,
    kartSahibi: "mert",
    renk: "emerald",
    createdAt: new Date().toISOString(),
  },
  {
    id: "kart_ykb_world",
    ad: "Yapı Kredi World",
    banka: "Yapı Kredi",
    ekstreGunu: 5,
    sonOdemeGunu: 15,
    kartSahibi: "havsa",
    renk: "blue",
    createdAt: new Date().toISOString(),
  },
];

export function getTaksitKartlari(): TaksitKarti[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TAKSiT_KARTLARI);
    if (!raw) {
      // İlk açılışta örnek 2 kart hazırla
      localStorage.setItem(STORAGE_KEY_TAKSiT_KARTLARI, JSON.stringify(VARSAYILAN_KARTLAR));
      return VARSAYILAN_KARTLAR;
    }
    const list: TaksitKarti[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("Error reading taksit kartlari", err);
    return [];
  }
}

export function saveTaksitKartlari(kartlar: TaksitKarti[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY_TAKSiT_KARTLARI, JSON.stringify(kartlar));
    notifyChange();
  } catch (err) {
    console.error("Error saving taksit kartlari", err);
  }
}

export function addTaksitKarti(kartInput: Omit<TaksitKarti, "id" | "createdAt">): TaksitKarti {
  const kartlar = getTaksitKartlari();
  const yeni: TaksitKarti = {
    ...kartInput,
    id: `kart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  kartlar.push(yeni);
  saveTaksitKartlari(kartlar);
  return yeni;
}

export function updateTaksitKarti(id: string, guncel: Partial<TaksitKarti>): TaksitKarti | null {
  const kartlar = getTaksitKartlari();
  const idx = kartlar.findIndex((k) => k.id === id);
  if (idx === -1) return null;
  const updated = { ...kartlar[idx], ...guncel };
  kartlar[idx] = updated;
  saveTaksitKartlari(kartlar);
  return updated;
}

export function deleteTaksitKarti(id: string): boolean {
  const kartlar = getTaksitKartlari();
  const filtered = kartlar.filter((k) => k.id !== id);
  if (filtered.length === kartlar.length) return false;
  saveTaksitKartlari(filtered);

  // İlgili karta ait taksitleri de temizle veya sil
  const taksitler = getTaksitler();
  const filteredTaksitler = taksitler.filter((t) => t.kartId !== id);
  saveTaksitler(filteredTaksitler);

  return true;
}

// ------------------------------------------------------------------
// TAKSİTLER (INSTALLMENT ITEMS)
// ------------------------------------------------------------------

export function getTaksitler(): TaksitKalemi[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TAKSiTLER);
    if (!raw) return [];
    const list: TaksitKalemi[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error("Error reading taksitler", err);
    return [];
  }
}

export function saveTaksitler(taksitler: TaksitKalemi[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY_TAKSiTLER, JSON.stringify(taksitler));
    notifyChange();
  } catch (err) {
    console.error("Error saving taksitler", err);
  }
}

export function addTaksit(input: Omit<TaksitKalemi, "id" | "createdAt" | "aylikTutar"> & { aylikTutar?: number }): TaksitKalemi {
  const taksitler = getTaksitler();
  const toplam = Number(input.toplamTutar) || 0;
  const adet = Math.max(1, Number(input.toplamTaksit) || 1);
  const aylik = input.aylikTutar && input.aylikTutar > 0 ? Number(input.aylikTutar) : Math.round((toplam / adet) * 100) / 100;

  const yeni: TaksitKalemi = {
    ...input,
    id: `taksit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    toplamTutar: toplam,
    toplamTaksit: adet,
    odenenTaksit: Math.min(adet, Math.max(0, Number(input.odenenTaksit) || 0)),
    aylikTutar: aylik,
    createdAt: new Date().toISOString(),
  };

  taksitler.unshift(yeni);
  saveTaksitler(taksitler);
  return yeni;
}

export function updateTaksit(id: string, guncel: Partial<TaksitKalemi>): TaksitKalemi | null {
  const taksitler = getTaksitler();
  const idx = taksitler.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const prev = taksitler[idx];
  const toplam = guncel.toplamTutar !== undefined ? Number(guncel.toplamTutar) : prev.toplamTutar;
  const adet = guncel.toplamTaksit !== undefined ? Math.max(1, Number(guncel.toplamTaksit)) : prev.toplamTaksit;
  const aylik = guncel.aylikTutar !== undefined ? Number(guncel.aylikTutar) : Math.round((toplam / adet) * 100) / 100;

  const updated: TaksitKalemi = {
    ...prev,
    ...guncel,
    toplamTutar: toplam,
    toplamTaksit: adet,
    odenenTaksit: guncel.odenenTaksit !== undefined ? Math.min(adet, Math.max(0, Number(guncel.odenenTaksit))) : prev.odenenTaksit,
    aylikTutar: aylik,
    updatedAt: new Date().toISOString(),
  };

  taksitler[idx] = updated;
  saveTaksitler(taksitler);
  return updated;
}

export function deleteTaksit(id: string): boolean {
  const taksitler = getTaksitler();
  const filtered = taksitler.filter((t) => t.id !== id);
  if (filtered.length === taksitler.length) return false;
  saveTaksitler(filtered);
  return true;
}

/** Taksit sayısını 1 artırır (+1 taksit ödendi) */
export function incrementTaksit(id: string): TaksitKalemi | null {
  const taksitler = getTaksitler();
  const item = taksitler.find((t) => t.id === id);
  if (!item || item.odenenTaksit >= item.toplamTaksit) return null;
  return updateTaksit(id, { odenenTaksit: item.odenenTaksit + 1 });
}

/** Taksit sayısını 1 azaltır (-1 geri al) */
export function decrementTaksit(id: string): TaksitKalemi | null {
  const taksitler = getTaksitler();
  const item = taksitler.find((t) => t.id === id);
  if (!item || item.odenenTaksit <= 0) return null;
  return updateTaksit(id, { odenenTaksit: item.odenenTaksit - 1 });
}

/** Bir karta ait tüm devam eden taksitleri 1 ay ilerletir (+1 taksit ödendi) */
export function incrementAllTaksitlerForKart(kartId: string): number {
  const taksitler = getTaksitler();
  let updatedCount = 0;
  const now = new Date().toISOString();

  const nextList = taksitler.map((item) => {
    if (item.kartId === kartId && item.odenenTaksit < item.toplamTaksit) {
      updatedCount++;
      return {
        ...item,
        odenenTaksit: item.odenenTaksit + 1,
        updatedAt: now,
      };
    }
    return item;
  });

  if (updatedCount > 0) {
    saveTaksitler(nextList);
  }
  return updatedCount;
}

// ------------------------------------------------------------------
// TARİH & VADE HESAPLAMA MOTORU
// ------------------------------------------------------------------

/**
 * Kartın ekstre ve son ödeme gününe göre son ödeme tarihini hesaplar.
 * @param kart TaksitKarti
 * @param kalanTaksit number
 */
export function hesaplaTaksitVadesi(kart: TaksitKarti | undefined, taksit: TaksitKalemi): TaksitVadeHesabi {
  const kalanTaksit = Math.max(0, taksit.toplamTaksit - taksit.odenenTaksit);
  const kalanTutar = kalanTaksit * taksit.aylikTutar;
  const tamamlandi = kalanTaksit === 0;

  if (tamamlandi || !kart) {
    return {
      kalanTaksit: 0,
      kalanTutar: 0,
      tamamlandi: true,
      siradakiSonOdemeTarihi: null,
      siradakiSonOdemeKalanGun: null,
      bitisSonOdemeTarihi: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Kartın son ödeme gününü belirle (verilmediyse ekstre + 10 gün)
  const ekstreGunu = Math.min(31, Math.max(1, kart.ekstreGunu));
  let sonOdemeGunu = kart.sonOdemeGunu ? Math.min(31, Math.max(1, kart.sonOdemeGunu)) : ekstreGunu + 10;
  let sonOdemeAyOfseti = 0;

  // Eğer son ödeme günü ekstre gününden küçükse (örn: ekstre 25, son ödeme 5),
  // son ödeme bir sonraki takvim ayına sarkar!
  if (sonOdemeGunu < ekstreGunu) {
    sonOdemeAyOfseti = 1;
  }

  // Bu ayki hesaplanan son ödeme tarihi
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Bu ayın son ödeme tarihi
  const buAykiSonOdeme = new Date(currentYear, currentMonth + sonOdemeAyOfseti, sonOdemeGunu);

  let siradakiTarih: Date;

  if (today <= buAykiSonOdeme) {
    // Bu ayki son ödeme henüz geçmedi, sıradaki son ödeme bu aydır
    siradakiTarih = buAykiSonOdeme;
  } else {
    // Bu ayki son ödeme geçti, sıradaki son ödeme bir sonraki aydır
    siradakiTarih = new Date(currentYear, currentMonth + sonOdemeAyOfseti + 1, sonOdemeGunu);
  }

  // Sıradaki son ödemeye kaç gün kaldı?
  const diffTime = siradakiTarih.getTime() - today.getTime();
  const siradakiSonOdemeKalanGun = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Son taksit bitiş tarihi (kalan taksit sayısına göre)
  // 1 taksit kaldıysa -> siradakiTarih
  // K taksit kaldıysa -> siradakiTarih + (K - 1) ay
  const bitisTarihi = new Date(
    siradakiTarih.getFullYear(),
    siradakiTarih.getMonth() + (kalanTaksit - 1),
    sonOdemeGunu
  );

  const formatDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    kalanTaksit,
    kalanTutar,
    tamamlandi: false,
    siradakiSonOdemeTarihi: formatDate(siradakiTarih),
    siradakiSonOdemeKalanGun,
    bitisSonOdemeTarihi: formatDate(bitisTarihi),
  };
}

/**
 * Kartın bir sonraki son ödeme gününü ve bugünden itibaren kaç gün kaldığını hesaplar.
 */
export function hesaplaKartSonOdemeDurumu(kart: TaksitKarti): {
  siradakiTarih: Date;
  kalanGun: number;
  tarihStr: string;
  durum: "bugun" | "cok_yakin" | "yaklasiyor" | "normal";
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ekstreGunu = Math.min(31, Math.max(1, kart.ekstreGunu));
  let sonOdemeGunu = kart.sonOdemeGunu ? Math.min(31, Math.max(1, kart.sonOdemeGunu)) : ekstreGunu + 10;
  let sonOdemeAyOfseti = sonOdemeGunu < ekstreGunu ? 1 : 0;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Bu ayki son ödeme tarihi (veya ay ofsetli)
  const buAykiSonOdeme = new Date(currentYear, currentMonth + sonOdemeAyOfseti, sonOdemeGunu);

  let siradakiTarih: Date;
  if (today <= buAykiSonOdeme) {
    siradakiTarih = buAykiSonOdeme;
  } else {
    siradakiTarih = new Date(currentYear, currentMonth + sonOdemeAyOfseti + 1, sonOdemeGunu);
  }

  const diffTime = siradakiTarih.getTime() - today.getTime();
  const kalanGun = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  let durum: "bugun" | "cok_yakin" | "yaklasiyor" | "normal" = "normal";
  if (kalanGun === 0) {
    durum = "bugun";
  } else if (kalanGun <= 3) {
    durum = "cok_yakin";
  } else if (kalanGun <= 7) {
    durum = "yaklasiyor";
  }

  const ayAdi = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(siradakiTarih);
  const tarihStr = `${siradakiTarih.getDate()} ${ayAdi}`;

  return {
    siradakiTarih,
    kalanGun,
    tarihStr,
    durum,
  };
}
