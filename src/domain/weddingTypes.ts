export type WeddingKisi = "mert" | "havsa" | "ortak" | "diger";

export type AssetType = "cash" | "gold";

export type GoldType = "gram" | "ceyrek" | "yarim" | "tam";

export interface GoldPriceItem {
  kod: string;
  etiket: string;
  alis: number; // Kuyumcunun alış fiyatı (kullanıcının bozdurma fiyatı)
  satis: number; // Kuyumcunun satış fiyatı
  degisim24s?: number | null;
  guncelleme?: string | null;
}

export type GoldPricesMap = Record<GoldType, GoldPriceItem>;

export interface GoldPricesResponse {
  success: boolean;
  updatedAt: string;
  piyasa: "canli" | "durgun" | "bilinmiyor";
  isStale?: boolean;
  errorMessage?: string;
  kalemler: GoldPricesMap;
  dovizKurlari?: {
    usd: number;
    eur: number;
  };
}

export interface WeddingPiggyContribution {
  id: string;
  assetType?: AssetType; // "cash" | "gold" - eski kayıtlarda undefined olabilir, "cash" varsayılır
  ekleyenKisi: WeddingKisi;
  ekleyenKisiAd?: string;
  tutar: number; // Nakitte: nakit tutarı. Altında: toplam alış maliyeti (miktar * birimAlisFiyati)
  tarih: string; // YYYY-MM-DD
  aciklama?: string;
  createdAt: string;

  // Altın için özel alanlar
  goldType?: GoldType;
  miktar?: number; // Gram için örn: 2.50, çeyrek/yarım/tam için tam sayı adet
  birimAlisFiyati?: number; // Kullanıcının satın aldığı birim TL fiyatı
  toplamAlisMaliyeti?: number; // miktar * birimAlisFiyati
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

export type WeddingParticipantSide = "mert" | "havsa";

export interface WeddingParticipant {
  id: string;
  isim: string;
  yetiskin: number;
  cocuk: number;
  toplam: number;
  taraf: WeddingParticipantSide;
  createdAt: string;
}

export type WeddingTakiEventType = "nisan" | "kina" | "dugun";
export type WeddingTakiAssetType = "altin" | "usd" | "eur" | "tl";
export type WeddingTakiGoldSubType = "gram" | "ceyrek" | "yarim" | "tam" | "ajda" | "diger";

export interface WeddingTakiEventDates {
  nisan?: string;
  kina?: string;
  dugun?: string;
}

export interface WeddingTakiItem {
  id: string;
  etkinlik: WeddingTakiEventType;
  kimTakti: string;
  takiTuru: WeddingTakiAssetType;
  altinTuru?: WeddingTakiGoldSubType;
  digerAltinAciklama?: string;
  adet: number;
  gramaj?: number;
  tarihBirimFiyatTL: number;
  tarihToplamDegerTL: number;
  tarihGramAltinKuruTL?: number;
  tarih: string;
  notlar?: string;
  createdAt: string;
}

export interface WeddingTakiValuation {
  tarihToplamDegerTL: number;
  guncelBirimFiyatTL: number;
  guncelToplamDegerTL: number;
  farkTL: number;
  farkYuzde: number;
}

export interface WeddingData {
  kumbaraKatkilar: WeddingPiggyContribution[];
  maddeler: WeddingItem[];
  hedefTarih?: string;
  notlar?: string;
  katilimcilar?: WeddingParticipant[];
  takiEtkinlikTarihleri?: WeddingTakiEventDates;
  takilar?: WeddingTakiItem[];
}

export interface GoldSummaryItem {
  goldType: GoldType;
  etiket: string;
  miktar: number;
  birim: "gram" | "adet";
  toplamAlisMaliyeti: number;
  guncelBirimAlisFiyati: number;
  guncelToplamDeger: number;
  karZararTL: number;
  karZararYuzde: number;
}

export interface WeddingStats {
  toplamBiriken: number; // Nakit + Altınların Güncel Değeri
  toplamNakitBiriken: number; // Sadece nakit
  toplamAltinGuncelDeger: number; // Altınların güncel TL değeri (API alış fiyatı ile)
  toplamAltinAlisMaliyeti: number; // Kullanıcıların altınları alırken ödediği toplam maliyet
  altinKarZararTL: number; // Toplam altın kâr/zarar TL
  altinKarZararYuzde: number; // Toplam altın kâr/zarar %
  mertBiriken: number;
  havsaBiriken: number;
  ortakBiriken: number;
  digerBiriken: number;
  harcananPara: number;
  kalanKumbara: number;
  kalanGerekenHarcama: number;
  toplamGerekenButce: number;
  tamamlananSayisi: number;
  toplamMaddeSayisi: number;
  tamamlanmaYuzdesi: number;
  kumbaraKarsilamaYuzdesi: number;
  goldSummaries: Record<GoldType, GoldSummaryItem>;
  toplamAltinAdetGram: {
    gram: number;
    ceyrek: number;
    yarim: number;
    tam: number;
  };
}
