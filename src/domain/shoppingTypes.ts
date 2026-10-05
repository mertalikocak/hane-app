export type ShoppingCategory = "market" | "cleaning" | "personal" | "home" | "other";

export interface ShoppingCustomItem {
  id: string;
  title: string;
  quantity?: string; // örn: "2 paket", "1 kg", "3 adet"
  category?: ShoppingCategory;
  note?: string;
  isCompleted: boolean;
  createdAt: string;
}

export const SHOPPING_CATEGORIES: { id: ShoppingCategory; label: string; icon: string; color: string }[] = [
  { id: "market", label: "Gıda & Market", icon: "🍎", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "cleaning", label: "Temizlik & Hijyen", icon: "🧼", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" },
  { id: "personal", label: "Kişisel Bakım", icon: "🧴", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { id: "home", label: "Ev & Yaşam", icon: "🏠", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "other", label: "Diğer", icon: "📦", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
];
