"use client";

import { ShoppingItemCheckbox } from "@/components/dinner/ShoppingItemCheckbox";
import type { LocalShoppingItem } from "@/lib/local-storage/store";
import { useMemo, useState } from "react";
import { ShoppingBagIcon } from "@/components/ui/Icons";

interface ShoppingListProps {
  items: LocalShoppingItem[];
  onToggle: (key: string, isCompleted: boolean) => void;
}

export function ShoppingList({ items, onToggle }: ShoppingListProps) {
  const [isCopied, setIsCopied] = useState(false);

  const completedCount = items.filter((item) => item.isCompleted).length;

  const sortedItems = useMemo(() => {
    const uncompleted = items.filter((item) => !item.isCompleted);
    const completed = items.filter((item) => item.isCompleted);
    return [...uncompleted, ...completed];
  }, [items]);

  async function copyShoppingList(): Promise<void> {
    const text = items
      .filter((item) => !item.isCompleted)
      .map((item) => `${item.quantity} ${item.unit} ${item.ingredientName}`)
      .join("\n");

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <section
      className="rounded-[18px] border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-xs)]"
      aria-labelledby="shopping-list-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent border border-border-lavender text-primary">
            <ShoppingBagIcon className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="shopping-list-heading"
              className="text-base sm:text-lg font-semibold tracking-tight text-foreground"
            >
              Haftalık Tarif Malzemeleri Listesi
            </h2>
            <p className="text-xs text-muted">
              Planlanan yemeklere göre otomatik hesaplanır ve Alışveriş modülüyle senkronize çalışır
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {items.length > 0 && (
            <span className="rounded-lg bg-background border border-border px-2.5 py-1 text-xs font-semibold text-foreground tabular-nums">
              {completedCount} / {items.length} alındı
            </span>
          )}
          <button
            type="button"
            onClick={copyShoppingList}
            disabled={items.length === 0}
            className="secondary-button min-h-[36px] px-3 py-1.5 text-xs"
            aria-label="Alışveriş listesini kopyala"
          >
            {isCopied ? "✓ Kopyalandı" : "Listeyi Kopyala"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-[12px] border border-dashed border-border-strong bg-background/50 p-7 text-center">
          <p className="text-sm font-medium text-foreground-secondary">
            Bu haftanın planında henüz malzeme gerektiren bir yemek yok.
          </p>
          <p className="mt-1 text-xs text-muted">
            Yukarıdaki günlerden yemek ekledikçe gerekli malzemeler burada otomatik listelenecektir.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedItems.map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-3 rounded-[10px] border p-3 transition-colors cursor-pointer select-none ${
                item.isCompleted
                  ? "border-border bg-background/40 opacity-65"
                  : "border-border bg-background/70 hover:border-primary/40 hover:bg-surface-raised"
              }`}
            >
              <ShoppingItemCheckbox
                isCompleted={item.isCompleted}
                onChange={(isCompleted) => onToggle(item.key, isCompleted)}
              />
              <span
                className={`text-xs sm:text-sm truncate ${
                  item.isCompleted ? "text-muted line-through" : "text-foreground font-medium"
                }`}
              >
                <strong className="font-semibold text-primary tabular-nums">
                  {item.quantity} {item.unit}
                </strong>{" "}
                {item.ingredientName}
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
