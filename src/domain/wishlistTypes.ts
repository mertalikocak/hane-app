export type WishlistPriority = "low" | "medium" | "high";

export type WishlistCategory =
  | "home"
  | "tech"
  | "fashion"
  | "hobby"
  | "travel"
  | "gift"
  | "other";

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  price?: number;
  url?: string;
  /**
   * "hane" indicates common family wishes.
   * A profile id (e.g. "prof_1...") indicates a specific person's wish list.
   */
  targetSection: string; // "hane" | profileId
  completed: boolean;
  priority?: WishlistPriority;
  category?: WishlistCategory;
  createdAt: string;
  completedAt?: string;
  createdByProfileId?: string;
  createdByName?: string;
}

export const WISHLIST_CATEGORIES: Record<
  WishlistCategory,
  { id: WishlistCategory; label: string; icon: string; bgClass: string; textClass: string; borderClass: string }
> = {
  home: {
    id: "home",
    label: "Ev & Yaşam",
    icon: "🛋️",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-500/30",
  },
  tech: {
    id: "tech",
    label: "Teknoloji",
    icon: "💻",
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-500/30",
  },
  fashion: {
    id: "fashion",
    label: "Giyim & Aksesuar",
    icon: "👟",
    bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-500/30",
  },
  hobby: {
    id: "hobby",
    label: "Hobi & Spor",
    icon: "🎨",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-500/30",
  },
  travel: {
    id: "travel",
    label: "Seyahat & Deneyim",
    icon: "✈️",
    bgClass: "bg-sky-500/10 dark:bg-sky-500/20",
    textClass: "text-sky-700 dark:text-sky-300",
    borderClass: "border-sky-500/30",
  },
  gift: {
    id: "gift",
    label: "Hediye",
    icon: "🎁",
    bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
    textClass: "text-rose-700 dark:text-rose-300",
    borderClass: "border-rose-500/30",
  },
  other: {
    id: "other",
    label: "Diğer",
    icon: "✨",
    bgClass: "bg-zinc-500/10 dark:bg-zinc-500/20",
    textClass: "text-zinc-700 dark:text-zinc-300",
    borderClass: "border-zinc-500/30",
  },
};
