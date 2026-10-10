export type WeddingKisi = "mert" | "havsa" | "diger";

export interface WeddingPiggyContribution {
  id: string;
  ekleyenKisi: WeddingKisi;
  ekleyenKisiAd?: string;
  tutar: number;
  tarih: string; // YYYY-MM-DD
  aciklama?: string;
  createdAt: string;
}

export type WeddingItemCategory =
  | "mekan"
  | "giyim"
  | "fotograf"
  | "davetiye"
  | "ceyiz"
  | "balayi"
  | "diger";

export interface WeddingItem {
  id: string;
  baslik: string;
  kategori: WeddingItemCategory;
  tutar: number;
  tamamlandi: boolean;
  tamamlanmaTarihi?: string;
  sorumluKisi?: "mert" | "havsa" | "ortak";
  notlar?: string;
  createdAt: string;
}

export interface WeddingData {
  kumbaraKatkilar: WeddingPiggyContribution[];
  maddeler: WeddingItem[];
  hedefTarih?: string;
  notlar?: string;
}

export interface WeddingStats {
  toplamBiriken: number;
  mertBiriken: number;
  havsaBiriken: number;
  digerBiriken: number;
  harcananPara: number;
  kalanKumbara: number;
  kalanGerekenHarcama: number;
  toplamGerekenButce: number;
  tamamlananSayisi: number;
  toplamMaddeSayisi: number;
  tamamlanmaYuzdesi: number;
  kumbaraKarsilamaYuzdesi: number;
}
