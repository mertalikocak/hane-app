export type CleaningMethodId =
  | "vacuum"        // Süpürüldü (Klasik / Şarjlı Süpürge)
  | "mop"           // Paspas yapıldı / Islak silindi
  | "robot"         // Robot süpürge ile temizlendi
  | "dusting"       // Toz alındı
  | "deep_clean"    // Dip köşe / Detaylı temizlik
  | "sheets";       // Nevresim değişti

export interface CleaningMethodOption {
  id: CleaningMethodId;
  label: string;
  icon: string;
  shortLabel: string;
  description: string;
  badgeColor: string;
}

export const CLEANING_METHODS: CleaningMethodOption[] = [
  {
    id: "vacuum",
    label: "Süpürüldü",
    shortLabel: "Süpürge",
    icon: "🧹",
    description: "Klasik veya dikey süpürge ile çekildi",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    id: "mop",
    label: "Paspas Yapıldı",
    shortLabel: "Paspas",
    icon: "🪣",
    description: "Yer silindi, ıslak paspas atıldı",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    id: "robot",
    label: "Robot Süpürge",
    shortLabel: "Robot",
    icon: "🤖",
    description: "Robot süpürge/mop çalıştırıldı",
    badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  {
    id: "dusting",
    label: "Toz Alındı",
    shortLabel: "Toz",
    icon: "✨",
    description: "Mobilyaların, masaların tozu alındı",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    id: "deep_clean",
    label: "Dip Köşe Temizlik",
    shortLabel: "Dip Köşe",
    icon: "🧽",
    description: "Detaylı ovma, dolap içi ve köşe bucak",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "sheets",
    label: "Nevresim / Örtü Değişti",
    shortLabel: "Nevresim",
    icon: "🛏️",
    description: "Çarşaflar ve yastık kılıfları yenilendi",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
];

export interface CleaningRoom {
  id: string;
  name: string;
  icon: string;
  targetDaysInterval?: number; // kaç günde bir temizlenmeli (örn. 3 gün)
  notes?: string;
}

export const DEFAULT_ROOMS: CleaningRoom[] = [];

export interface CleaningRecord {
  id: string;
  roomId: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  methods: CleaningMethodId[]; // Seçilen temizlik türleri (süpürüldü, paspas, robot vs.)
  note?: string;
  cleanedBy?: string; // Temizliği yapan kişi (profil adı)
  createdAt: string; // ISO
}

export interface RoomStatus {
  room: CleaningRoom;
  lastRecord?: CleaningRecord;
  daysAgo: number | null; // null if never cleaned
  statusLevel: "fresh" | "normal" | "due" | "overdue";
}
