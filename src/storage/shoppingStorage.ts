"use client";

import { ShoppingCustomItem } from "@/domain/shoppingTypes";
import { createId } from "@/lib/local-storage/store";

export const STORAGE_KEY_CUSTOM_SHOPPING = "hane-shopping:custom_items";

export function getAllCustomShopping(): Record<string, ShoppingCustomItem[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SHOPPING);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAllCustomShopping(data: Record<string, ShoppingCustomItem[]>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CUSTOM_SHOPPING, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("hane-shopping:updated"));
}

export function getWeekCustomShopping(weekStart: string): ShoppingCustomItem[] {
  const all = getAllCustomShopping();
  return all[weekStart] || [];
}

export function saveWeekCustomShopping(weekStart: string, items: ShoppingCustomItem[]): void {
  const all = getAllCustomShopping();
  all[weekStart] = items;
  saveAllCustomShopping(all);
}

export function addCustomShoppingItem(
  weekStart: string,
  data: { title: string; quantity?: string; category?: ShoppingCustomItem["category"]; note?: string }
): ShoppingCustomItem {
  const items = getWeekCustomShopping(weekStart);
  const newItem: ShoppingCustomItem = {
    id: createId(),
    title: data.title.trim(),
    quantity: data.quantity?.trim() || undefined,
    category: data.category || "market",
    note: data.note?.trim() || undefined,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };

  saveWeekCustomShopping(weekStart, [newItem, ...items]);
  return newItem;
}

export function toggleCustomShoppingItem(weekStart: string, id: string): void {
  const items = getWeekCustomShopping(weekStart);
  const updated = items.map((item) =>
    item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
  );
  saveWeekCustomShopping(weekStart, updated);
}

export function deleteCustomShoppingItem(weekStart: string, id: string): void {
  const items = getWeekCustomShopping(weekStart);
  const updated = items.filter((item) => item.id !== id);
  saveWeekCustomShopping(weekStart, updated);
}

/**
 * Transfers all uncompleted items from current week to next week
 */
export function carryUncompletedToNextWeek(
  currentWeekStart: string,
  nextWeekStart: string
): { count: number; transferred: ShoppingCustomItem[] } {
  const currentItems = getWeekCustomShopping(currentWeekStart);
  const uncompleted = currentItems.filter((item) => !item.isCompleted);

  if (uncompleted.length === 0) {
    return { count: 0, transferred: [] };
  }

  const nextItems = getWeekCustomShopping(nextWeekStart);
  const nextItemTitles = new Set(nextItems.map((i) => i.title.toLowerCase().trim()));

  const toAdd: ShoppingCustomItem[] = [];

  for (const item of uncompleted) {
    // Avoid exact duplicate title in next week
    if (!nextItemTitles.has(item.title.toLowerCase().trim())) {
      toAdd.push({
        ...item,
        id: createId(),
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (toAdd.length > 0) {
    saveWeekCustomShopping(nextWeekStart, [...toAdd, ...nextItems]);
  }

  return { count: toAdd.length, transferred: toAdd };
}

export function clearWeekShopping(weekStart: string, onlyCompleted: boolean = false): void {
  const items = getWeekCustomShopping(weekStart);
  if (onlyCompleted) {
    const remaining = items.filter((item) => !item.isCompleted);
    saveWeekCustomShopping(weekStart, remaining);
  } else {
    saveWeekCustomShopping(weekStart, []);
  }
}
