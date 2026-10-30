"use client";

import { ShoppingCustomItem, ShoppingCategory } from "@/domain/shoppingTypes";
import { createId } from "@/lib/local-storage/store";

export const STORAGE_KEY_CUSTOM_SHOPPING = "hane-shopping:custom_items";

/**
 * Reads all custom shopping items as a single flat list.
 * Automatically migrates legacy week-keyed objects: { "2026-W44": [...] } -> [...]
 */
export function getCustomShoppingList(): ShoppingCustomItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SHOPPING);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    // If it's already an array, return it
    if (Array.isArray(parsed)) {
      return parsed;
    }

    // Migration: Legacy object with week keys { [weekStart]: items[] }
    if (parsed && typeof parsed === "object") {
      const allItems: ShoppingCustomItem[] = [];
      const seenIds = new Set<string>();

      for (const weekItems of Object.values(parsed)) {
        if (Array.isArray(weekItems)) {
          for (const item of weekItems) {
            if (item && item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              allItems.push(item);
            }
          }
        }
      }

      // Save migrated flat array back to storage
      localStorage.setItem(STORAGE_KEY_CUSTOM_SHOPPING, JSON.stringify(allItems));
      return allItems;
    }

    return [];
  } catch {
    return [];
  }
}

export function saveCustomShoppingList(items: ShoppingCustomItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CUSTOM_SHOPPING, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("hane-shopping:updated"));
}

export function addCustomShoppingItem(
  firstArg: string | { title: string; quantity?: string; category?: ShoppingCategory; note?: string },
  secondArg?: { title: string; quantity?: string; category?: ShoppingCategory; note?: string }
): ShoppingCustomItem {
  const data = typeof firstArg === "object" ? firstArg : (secondArg || { title: "" });
  const items = getCustomShoppingList();
  const newItem: ShoppingCustomItem = {
    id: createId(),
    title: data.title.trim(),
    quantity: data.quantity?.trim() || undefined,
    category: data.category || "market",
    note: data.note?.trim() || undefined,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };

  saveCustomShoppingList([newItem, ...items]);
  return newItem;
}

export function toggleCustomShoppingItem(firstArg: string, secondArg?: string): void {
  // Support both toggleCustomShoppingItem(id) and toggleCustomShoppingItem(weekStart, id)
  const id = secondArg ? secondArg : firstArg;
  const items = getCustomShoppingList();
  const updated = items.map((item) =>
    item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
  );
  saveCustomShoppingList(updated);
}

export function deleteCustomShoppingItem(firstArg: string, secondArg?: string): void {
  // Support both deleteCustomShoppingItem(id) and deleteCustomShoppingItem(weekStart, id)
  const id = secondArg ? secondArg : firstArg;
  const items = getCustomShoppingList();
  const updated = items.filter((item) => item.id !== id);
  saveCustomShoppingList(updated);
}

export function clearCompletedCustomShopping(): void {
  const items = getCustomShoppingList();
  const remaining = items.filter((item) => !item.isCompleted);
  saveCustomShoppingList(remaining);
}

export function clearAllCustomShopping(): void {
  saveCustomShoppingList([]);
}

// ================= BACKWARD COMPATIBILITY WRAPPERS =================
export function getAllCustomShopping(): Record<string, ShoppingCustomItem[]> {
  const items = getCustomShoppingList();
  return { current: items };
}

export function saveAllCustomShopping(data: Record<string, ShoppingCustomItem[]>): void {
  const first = Object.values(data)[0] || [];
  saveCustomShoppingList(first);
}

export function getWeekCustomShopping(_weekStart?: string): ShoppingCustomItem[] {
  return getCustomShoppingList();
}

export function saveWeekCustomShopping(_weekStart: string, items: ShoppingCustomItem[]): void {
  saveCustomShoppingList(items);
}

export function clearWeekShopping(_weekStart?: string, onlyCompleted: boolean = false): void {
  if (onlyCompleted) {
    clearCompletedCustomShopping();
  } else {
    clearAllCustomShopping();
  }
}

export function carryUncompletedToNextWeek(
  _currentWeekStart?: string,
  _nextWeekStart?: string
): { count: number; transferred: ShoppingCustomItem[] } {
  return { count: 0, transferred: [] };
}
