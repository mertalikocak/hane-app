export type CalendarScope = "common" | "personal";

export type CalendarCategory =
  | "default"
  | "birthday"
  | "work"
  | "health"
  | "bill"
  | "trip"
  | "family"
  | "shift";

export interface CalendarCategoryInfo {
  id: CalendarCategory;
  label: string;
  icon: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const CALENDAR_CATEGORIES: Record<CalendarCategory, CalendarCategoryInfo> = {
  default: {
    id: "default",
    label: "Genel",
    icon: "📅",
    color: "#6366f1",
    bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20",
    textClass: "text-indigo-600 dark:text-indigo-400",
    borderClass: "border-indigo-500/30",
  },
  family: {
    id: "family",
    label: "Aile & Ev",
    icon: "🏠",
    color: "#f97316",
    bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
    textClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-500/30",
  },
  birthday: {
    id: "birthday",
    label: "Kutlama & Doğum Günü",
    icon: "🎂",
    color: "#ec4899",
    bgClass: "bg-pink-500/10 dark:bg-pink-500/20",
    textClass: "text-pink-600 dark:text-pink-400",
    borderClass: "border-pink-500/30",
  },
  health: {
    id: "health",
    label: "Sağlık & Doktor",
    icon: "🏥",
    color: "#10b981",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-500/30",
  },
  bill: {
    id: "bill",
    label: "Fatura & Ödeme",
    icon: "💰",
    color: "#eab308",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500/30",
  },
  work: {
    id: "work",
    label: "İş & Randevu",
    icon: "💼",
    color: "#0ea5e9",
    bgClass: "bg-sky-500/10 dark:bg-sky-500/20",
    textClass: "text-sky-600 dark:text-sky-400",
    borderClass: "border-sky-500/30",
  },
  trip: {
    id: "trip",
    label: "Seyahat & Tatil",
    icon: "✈️",
    color: "#8b5cf6",
    bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
    textClass: "text-purple-600 dark:text-purple-400",
    borderClass: "border-purple-500/30",
  },
  shift: {
    id: "shift",
    label: "Nöbet",
    icon: "🚨",
    color: "#f43f5e",
    bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
    textClass: "text-rose-600 dark:text-rose-400",
    borderClass: "border-rose-500/30",
  },
};

export interface CalendarEvent {
  id: string;
  title: string;              // Zorunlu başlık
  description?: string;       // Opsiyonel açıklama
  date: string;               // YYYY-MM-DD
  endDate?: string;           // YYYY-MM-DD (opsiyonel)
  time?: string;              // HH:mm (opsiyonel)
  endTime?: string;           // HH:mm (opsiyonel)
  isAllDay: boolean;          // Tüm gün
  scope: CalendarScope;       // "common" (Ortak) veya "personal" (Kişisel)
  targetProfileId?: string;   // Kişisel ise kime ait olduğu
  targetProfileName?: string; // Profil adı
  createdByProfileId: string; // Oluşturan profil ID
  createdByName: string;      // Oluşturan profil adı
  category: CalendarCategory;
  createdAt: string;          // ISO string
  updatedAt?: string;         // ISO string
}
