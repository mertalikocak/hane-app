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
import {
  ModuleLucideIcon,
  ArrowUpDownIcon,
  CloseIcon,
} from "@/components/ui/Icons";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#30263A]/45 backdrop-blur-[2px] overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-[18px] border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-lg)] space-y-4 my-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent border border-border-lavender text-primary">
              <ArrowUpDownIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Menüyü Kişiselleştir
              </h2>
              <p className="text-xs text-muted">
                Modülleri yukarı/aşağı taşıyın veya gizleyin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-8 w-8"
            aria-label="Kapat"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((item, index) => {
            const isHidden = hiddenSet.has(item.href);
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <div
                key={item.href}
                className={`flex items-center justify-between p-3 rounded-[10px] border transition-colors ${
                  isHidden
                    ? "border-border bg-background/40 opacity-60"
                    : "border-border bg-background/70 hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface border border-border text-[11px] font-semibold text-muted shrink-0 tabular-nums">
                    {index + 1}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/70 text-primary">
                    <ModuleLucideIcon href={item.href} className="h-4 w-4" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-accent text-primary border border-border-lavender">
                          {item.badge}
                        </span>
                      )}
                      {isHidden && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-danger-bg text-danger border border-danger-border">
                          Gizli
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted truncate">
                      {item.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMoveUp(index)}
                    className="icon-button h-8 w-8 text-xs font-semibold"
                    title="Yukarı Taşı"
                    aria-label={`${item.name} yukarı taşı`}
                  >
                    ▲
                  </button>

                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMoveDown(index)}
                    className="icon-button h-8 w-8 text-xs font-semibold"
                    title="Aşağı Taşı"
                    aria-label={`${item.name} aşağı taşı`}
                  >
                    ▼
                  </button>

                  {item.href !== "/" && (
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(item.href)}
                      className={`flex h-8 px-2 items-center justify-center rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                        isHidden
                          ? "bg-danger-bg border-danger-border text-danger hover:bg-danger hover:text-white"
                          : "bg-surface border-border text-foreground-secondary hover:text-foreground hover:border-border-strong"
                      }`}
                      title={isHidden ? "Menüde Göster" : "Menüden Gizle"}
                      aria-label={`${item.name} görünürlüğünü değiştir`}
                    >
                      {isHidden ? "Göster" : "Gizle"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-muted hover:text-danger transition-colors cursor-pointer"
          >
            Varsayılana Sıfırla
          </button>
          <button
            type="button"
            onClick={onClose}
            className="primary-button text-xs px-5 py-2"
          >
            Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}
