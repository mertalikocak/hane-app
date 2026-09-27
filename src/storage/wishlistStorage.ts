import { WishlistItem } from "@/domain/wishlistTypes";

const WISHLIST_STORAGE_KEY = "hane_wishlist_items";

export function getWishlistItems(): WishlistItem[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading wishlist from localStorage", err);
    return [];
  }
}

export function saveWishlistItem(
  item: Omit<WishlistItem, "id" | "createdAt"> & { id?: string; createdAt?: string }
): WishlistItem {
  const list = getWishlistItems();
  const now = new Date().toISOString();

  let savedItem: WishlistItem;

  if (item.id) {
    // Edit existing
    const existingIndex = list.findIndex((w) => w.id === item.id);
    if (existingIndex >= 0) {
      savedItem = {
        ...list[existingIndex],
        ...item,
        id: item.id,
        createdAt: list[existingIndex].createdAt,
      };
      list[existingIndex] = savedItem;
    } else {
      savedItem = {
        ...item,
        id: item.id,
        createdAt: item.createdAt || now,
        completed: item.completed ?? false,
      };
      list.unshift(savedItem);
    }
  } else {
    // Create new
    savedItem = {
      ...item,
      id: `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      completed: item.completed ?? false,
    };
    list.unshift(savedItem);
  }

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("wishlist_items_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Error saving wishlist to localStorage", err);
  }

  return savedItem;
}

export function toggleWishlistItem(id: string): boolean {
  const list = getWishlistItems();
  const index = list.findIndex((w) => w.id === id);
  if (index === -1) return false;

  const nextState = !list[index].completed;
  list[index].completed = nextState;
  list[index].completedAt = nextState ? new Date().toISOString() : undefined;

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("wishlist_items_updated"));
    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (err) {
    console.error("Error toggling wishlist item", err);
    return false;
  }
}

export function deleteWishlistItem(id: string): boolean {
  const list = getWishlistItems();
  const filtered = list.filter((w) => w.id !== id);
  if (filtered.length === list.length) return false;

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("wishlist_items_updated"));
    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (err) {
    console.error("Error deleting wishlist item", err);
    return false;
  }
}
