"use client";

import { ShoppingItemCheckbox } from "@/components/dinner/ShoppingItemCheckbox";
import type { LocalShoppingItem } from "@/lib/local-storage/store";
import { useState } from "react";
import { ShoppingBagIcon } from "@/components/ui/Icons";

interface ShoppingListProps {
  items: LocalShoppingItem[];
  onToggle: (key: string, isCompleted: boolean) => void;
}

export function ShoppingList({ items, onToggle }: ShoppingListProps) {
  const [isCopied, setIsCopied] = useState(false);

  const completedCount = items.filter((item) => item.isCompleted).length;

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
      className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs"
      aria-labelledby="shopping-list-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <ShoppingBagIcon className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="shopping-list-heading"
              className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
            >
              Haftalık Alışveriş Listesi
            </h2>
            <p className="text-xs text-muted">
              Planlanan yemeklere göre otomatik hesaplanır
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {items.length > 0 && (
            <span className="text-xs font-semibold text-muted">
              {completedCount} / {items.length} alındı
            </span>
          )}
          <button
            type="button"
            onClick={copyShoppingList}
            disabled={items.length === 0}
            className="secondary-button h-9 px-3 text-xs sm:text-sm font-semibold"
            aria-label="Alışveriş listesini kopyala"
          >
            {isCopied ? "✓ Kopyalandı" : "Listeyi Kopyala"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border/70 bg-surface-raised/40 p-8 text-center">
          <p className="text-sm font-medium text-muted">
            Bu haftanın planında henüz malzeme gerektiren bir yemek yok.
          </p>
          <p className="mt-1 text-xs text-muted/70">
            Yukarıdaki günlerden yemek ekledikçe gerekli malzemeler burada otomatik listelenecektir.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer select-none ${
                item.isCompleted
                  ? "border-border/40 bg-surface-raised/30 opacity-60"
                  : "border-border/80 bg-surface-raised/60 hover:border-primary/40 hover:bg-surface-raised"
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
                <strong className="font-semibold text-primary">
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
