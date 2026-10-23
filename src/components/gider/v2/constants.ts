import type { KullaniciId } from "@/domain/haneGiderTypes";

export const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export const KULLANICI_ETIKET: Record<KullaniciId, string> = {
  mert: "Mert",
  havsa: "Havsa",
};

export const ODEYEN_ETIKET: Record<"mert" | "havsa" | "ortak", string> = {
  mert: "Mert",
  havsa: "Havsa",
  ortak: "Ortak",
};

export const para = (n: number | null | undefined): string => {
  const val = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(val);
};

export function tutarMetniInputIcin(tutar: number): string {
  if (!Number.isFinite(tutar)) return "";
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(tutar);
}
