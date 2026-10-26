export interface NavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
  badge?: string;
  subItems?: { name: string; href: string }[];
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    name: "Ana Sayfa",
    href: "/",
    icon: "🏠",
    description: "Hane genel kontrol paneli",
  },
  {
    name: "Hane Dinner",
    href: "/dinner",
    icon: "🍽️",
    description: "Akşam yemeği & market listesi",
    subItems: [
      { name: "Haftalık Plan", href: "/dinner" },
      { name: "Yemek Kataloğu", href: "/dinner/meals" },
    ],
  },
  {
    name: "Hane Shopping",
    href: "/shopping",
    icon: "🛒",
    description: "Haftalık alışveriş & gıda listesi",
  },
  {
    name: "Hane Calendar",
    href: "/calendar",
    icon: "📅",
    description: "Ortak & bireysel aile takvimi",
  },
  {
    name: "Hane Gider",
    href: "/gider",
    icon: "💰",
    description: "Ev bütçesi & ekstre takibi",
  },
  {
    name: "Hane Fit",
    href: "/fit/dashboard",
    icon: "📐",
    description: "Vücut ölçüleri & yağ takibi",
    subItems: [
      { name: "Genel Bakış", href: "/fit/dashboard" },
      { name: "Ölçüm Geçmişi", href: "/fit/measurements" },
      { name: "Yeni Ölçüm", href: "/fit/measurements/new" },
      { name: "Profiller", href: "/fit/profiles" },
    ],
  },
  {
    name: "Hane Kalori",
    href: "/kalori",
    icon: "🥑",
    badge: "AI",
    description: "Yapay zeka beslenme & kalori takibi",
  },
  {
    name: "Hane Wish List",
    href: "/wishlist",
    icon: "🎁",
    description: "Ortak & bireysel istek listesi",
  },
  {
    name: "Hane Cleaning",
    href: "/cleaning",
    icon: "🧹",
    description: "Ev temizlik & oda bakım takibi",
  },
  {
    name: "Hane Wedding",
    href: "/wedding",
    icon: "💍",
    description: "Düğün bütçesi & ortak kumbara",
  },
  {
    name: "Hane Car",
    href: "/cardolist",
    icon: "🚗",
    description: "Araç masraf & bakım takibi",
  },
];

export const SIDEBAR_STORAGE_KEYS = {
  customOrder: "hane_sidebar_custom_order",
  hiddenItems: "hane_sidebar_hidden_items",
};

export function getCustomSidebarOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEYS.customOrder);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCustomSidebarOrder(order: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIDEBAR_STORAGE_KEYS.customOrder, JSON.stringify(order));
  window.dispatchEvent(new CustomEvent("hane_sidebar_order_changed"));
}

export function getHiddenSidebarItems(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEYS.hiddenItems);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setHiddenSidebarItems(hidden: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIDEBAR_STORAGE_KEYS.hiddenItems, JSON.stringify(hidden));
  window.dispatchEvent(new CustomEvent("hane_sidebar_order_changed"));
}

export function resetSidebarCustomization(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SIDEBAR_STORAGE_KEYS.customOrder);
  localStorage.removeItem(SIDEBAR_STORAGE_KEYS.hiddenItems);
  window.dispatchEvent(new CustomEvent("hane_sidebar_order_changed"));
}

export function getSortedNavItems(
  defaultItems: NavItem[] = DEFAULT_NAV_ITEMS,
  customOrder: string[] = [],
  hiddenHrefs: string[] = []
): NavItem[] {
  const hiddenSet = new Set(hiddenHrefs);
  const itemsMap = new Map(defaultItems.map((item) => [item.href, item]));
  const result: NavItem[] = [];

  // Özel sıralamadaki elemanları sırayla yerleştir
  for (const href of customOrder) {
    const item = itemsMap.get(href);
    if (item) {
      if (!hiddenSet.has(href)) {
        result.push(item);
      }
      itemsMap.delete(href);
    }
  }

  // Sıralamada henüz olmayan yeni/kalan elemanları da sona ekle
  for (const item of itemsMap.values()) {
    if (!hiddenSet.has(item.href)) {
      result.push(item);
    }
  }

  return result;
}
