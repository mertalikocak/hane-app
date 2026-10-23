import type {
  AyHaneGiderVerisi,
  BireyselAyriHarcama,
  BireyselEkstreKalemi,
  BireyselGelirKalemi,
  HaneTransferi,
  KrediKartiEkstresi,
  KullaniciId,
} from "@/domain/haneGiderTypes";
import type { MahsuplasmaSonucu } from "@/domain/ekstreHesapla";

export type GiderV2ViewMode = "ozet" | "kartlar" | "denetim" | "bireysel_gelir";

export interface LedgerItem {
  id: string;
  tur: "kart" | "bireysel_kalem" | "ayri_harcama" | "gelir" | "transfer";
  ad: string;
  detay?: string;
  odeyen: "mert" | "havsa" | "ortak" | "-";
  kimeAit: "ortak" | "mert" | "havsa";
  tutar: number;
  mertYuku: number;
  havsaYuku: number;
  tarih?: string;
  orijinalKartId?: string;
  orijinalKalemId?: string;
}

export interface GiderV2Calculations {
  genel: { mert: number; havsa: number };
  ortakPay: { mert: number; havsa: number };
  kisiselToplam: { mert: number; havsa: number };
  ayriBireyselToplam: { mert: number; havsa: number };
  ayriGelirToplam: { mert: number; havsa: number };
  mertGider: number;
  havsaGider: number;
  mertGelir: number;
  havsaGelir: number;
  mertKalan: number;
  havsaKalan: number;
  evGideriToplami: number;
  evGelirToplami: number;
  evKalan: number;
  kayitToplamlari: number;
  ayriBireyselHarcamalarToplami: number;
  herhangiAsim: boolean;
  mahsuplasma: MahsuplasmaSonucu;
}
