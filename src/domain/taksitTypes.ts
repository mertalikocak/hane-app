export type TaksitSahibi = "mert" | "havsa" | "ortak";

export type KartRengi =
  | "slate"
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "rose"
  | "cyan";

export interface TaksitKarti {
  id: string;
  ad: string; // örn: "Garanti Bonus", "Yapı Kredi World"
  banka?: string; // örn: "Garanti BBVA", "Yapı Kredi"
  ekstreGunu: number; // 1 - 31 (Hesap kesim günü)
  sonOdemeGunu?: number; // 1 - 31 (Belirtilmezse ekstre + 10 gün)
  kartSahibi: TaksitSahibi;
  renk?: KartRengi;
  sonHane?: string; // örn: "4129"
  kartLimiti?: number; // Opsiyonel kredi kartı limiti (TL)
  aktif?: boolean; // Varsayılan true; false ise hesaplara dahil edilmez
  createdAt: string;
}

export type TaksitKategori =
  | "elektronik"
  | "ev_yasam"
  | "giyim"
  | "araba"
  | "saglik"
  | "tatil"
  | "diger";

export interface TaksitKalemi {
  id: string;
  kartId: string; // Bağlı olduğu kart
  urunAdi: string; // örn: "iPhone 16", "Dyson V15"
  toplamTutar: number; // örn: 36000
  toplamTaksit: number; // örn: 6
  odenenTaksit: number; // örn: 2 (2 tanesi ödendi)
  aylikTutar: number; // örn: 6000 (toplamTutar / toplamTaksit)
  sahip: TaksitSahibi;
  kategori?: TaksitKategori;
  baslangicTarihi?: string; // YYYY-MM veya YYYY-MM-DD
  notlar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaksitVadeHesabi {
  kalanTaksit: number;
  kalanTutar: number;
  tamamlandi: boolean;
  siradakiSonOdemeTarihi: string | null; // YYYY-MM-DD
  siradakiSonOdemeKalanGun: number | null;
  bitisSonOdemeTarihi: string | null; // YYYY-MM-DD
}
