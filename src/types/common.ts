export type UUID = string;

/** Ölçü birimleri — alışveriş listesi birleştirme mantığında kullanılacak */
export type MeasurementUnit =
  | "adet"
  | "gram"
  | "kilogram"
  | "ml"
  | "litre"
  | "yemek kaşığı"
  | "çay kaşığı"
  | "paket"
  | "kutu"
  | "demet";

/** ISO-8601: 1 Pazartesi, 7 Pazar. */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7] as const;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
  6: "Cumartesi",
  7: "Pazar",
};
