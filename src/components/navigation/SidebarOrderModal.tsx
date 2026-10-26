"use client";

import React, { useState, useEffect } from "react";
import {
  DEFAULT_NAV_ITEMS,
  getCustomSidebarOrder,
  setCustomSidebarOrder,
  getHiddenSidebarItems,
  setHiddenSidebarItems,
  resetSidebarCustomization,
  type NavItem,
} from "@/storage/sidebarStorage";

interface SidebarOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderChanged: () => void;
}

export function SidebarOrderModal({
  isOpen,
  onClose,
  onOrderChanged,
}: SidebarOrderModalProps) {
  const [items, setItems] = useState<NavItem[]>([]);
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const customOrder = getCustomSidebarOrder();
      const hiddenList = getHiddenSidebarItems();
      setHiddenSet(new Set(hiddenList));

      // Construct current order (including hidden ones so user can reorder or unhide)
      const itemsMap = new Map(DEFAULT_NAV_ITEMS.map((item) => [item.href, item]));
      const ordered: NavItem[] = [];

      for (const href of customOrder) {
        const it = itemsMap.get(href);
        if (it) {
          ordered.push(it);
          itemsMap.delete(href);
        }
      }

      for (const it of itemsMap.values()) {
        ordered.push(it);
      }

      setItems(ordered);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    saveChanges(newItems, hiddenSet);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    saveChanges(newItems, hiddenSet);
  };

  const handleToggleVisibility = (href: string) => {
    // Ana sayfa gizlenemez
    if (href === "/") return;

    const newHidden = new Set(hiddenSet);
    if (newHidden.has(href)) {
      newHidden.delete(href);
    } else {
      newHidden.add(href);
    }
    setHiddenSet(newHidden);
    saveChanges(items, newHidden);
  };

  const saveChanges = (orderedItems: NavItem[], hidden: Set<string>) => {
    const orderHrefs = orderedItems.map((i) => i.href);
    setCustomSidebarOrder(orderHrefs);
    setHiddenSidebarItems(Array.from(hidden));
    onOrderChanged();
  };

  const handleReset = () => {
    resetSidebarCustomization();
    setItems(DEFAULT_NAV_ITEMS);
    setHiddenSet(new Set());
    onOrderChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg shadow-2xs">
              ⇅
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Menüyü Kişiselleştir
              </h2>
              <p className="text-xs text-muted">
                Uygulamaları yukarı/aşağı butonlarıyla sıralayın veya gizleyin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* List of Items with Up / Down / Hide buttons */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((item, index) => {
            const isHidden = hiddenSet.has(item.href);
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <div
                key={item.href}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isHidden
                    ? "border-border/40 bg-surface-raised/30 opacity-60"
                    : "border-border/80 bg-surface-raised/70 hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-border/60 text-[10px] font-black text-muted shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                          {item.badge}
                        </span>
                      )}
                      {isHidden && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/20">
                          Gizli
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted truncate">
                      {item.description}
                    </span>
                  </div>
                </div>

                {/* Up / Down / Toggle buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Up Button */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveUp(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface border border-border text-xs font-bold text-muted hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:hover:border-border transition cursor-pointer"
                    title="Yukarı Taşı"
                    aria-label={`${item.name} yukarı taşı`}
                  >
                    ▲
                  </button>

                  {/* Down Button */}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveDown(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface border border-border text-xs font-bold text-muted hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:hover:border-border transition cursor-pointer"
                    title="Aşağı Taşı"
                    aria-label={`${item.name} aşağı taşı`}
                  >
                    ▼
                  </button>

                  {/* Visibility Button (Ana sayfa gizlenemez) */}
                  {item.href !== "/" && (
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(item.href)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs transition cursor-pointer ${
                        isHidden
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20"
                          : "bg-surface border-border text-muted hover:text-foreground hover:border-primary/40"
                      }`}
                      title={isHidden ? "Menüde Göster" : "Menüden Gizle"}
                      aria-label={`${item.name} görünürlüğünü değiştir`}
                    >
                      {isHidden ? "👁️‍🗨️" : "👁️"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/70">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-muted hover:text-rose-500 transition cursor-pointer"
          >
            Varsayılana Sıfırla
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition cursor-pointer"
          >
            Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}
