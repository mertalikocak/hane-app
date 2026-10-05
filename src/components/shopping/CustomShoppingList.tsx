"use client";

import React, { useState } from "react";
import { ShoppingCustomItem } from "@/domain/shoppingTypes";
import {
  addCustomShoppingItem,
  toggleCustomShoppingItem,
  deleteCustomShoppingItem,
  carryUncompletedToNextWeek,
  clearWeekShopping,
} from "@/storage/shoppingStorage";
import { addWeeks } from "@/lib/date/week";

interface CustomShoppingListProps {
  weekStart: string;
  items: ShoppingCustomItem[];
  onRefresh: () => void;
}

export function CustomShoppingList({
  weekStart,
  items,
  onRefresh,
}: CustomShoppingListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.isCompleted).length;
  const uncompletedCount = items.length - completedCount;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCustomShoppingItem(weekStart, {
      title: newTitle,
      quantity: newQuantity,
    });

    setNewTitle("");
    setNewQuantity("");
    onRefresh();
  };

  const handleToggle = (id: string) => {
    toggleCustomShoppingItem(weekStart, id);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    deleteCustomShoppingItem(weekStart, id);
    onRefresh();
  };

  const handleCarryOver = () => {
    const nextWeekStart = addWeeks(weekStart, 1);
    const result = carryUncompletedToNextWeek(weekStart, nextWeekStart);

    if (result.count > 0) {
      setTransferMessage(`✓ Alınmayan ${result.count} ürün sonraki haftaya aktarıldı!`);
    } else {
      setTransferMessage("Aktarılacak alınmamış ürün bulunamadı veya hepsi sonraki haftada mevcut.");
    }

    setTimeout(() => {
      setTransferMessage(null);
    }, 3500);
  };

  const handleClearCompleted = () => {
    if (window.confirm("Tamamlanan ürünler listeden silinsin mi?")) {
      clearWeekShopping(weekStart, true);
      onRefresh();
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Bu haftanın tüm alışveriş listesini temizlemek istediğinize emin misiniz?")) {
      clearWeekShopping(weekStart, false);
      onRefresh();
    }
  };

  const handleCopyList = async () => {
    const uncompleted = items.filter((i) => !i.isCompleted);
    if (uncompleted.length === 0) return;

    const lines = ["🛒 *Hane Alışveriş Listesi*"];
    uncompleted.forEach((i) => {
      const q = i.quantity ? ` (${i.quantity})` : "";
      lines.push(`• ${i.title}${q}`);
    });

    const text = lines.join("\n");
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      {/* Quick Add Form */}
      <form
        onSubmit={handleAddItem}
        className="p-4 sm:p-5 rounded-3xl border border-border/80 bg-surface shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span>➕</span> Yeni Ürün Ekle
          </span>
          <span className="text-[11px] text-muted">Örn: Zeytinyağı, Kağıt Havlu vb.</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ne alınacak? (örn: Süt, Deterjan, Çöp Poşeti...)"
            className="flex-1 w-full px-4 py-2.5 rounded-2xl bg-surface-raised border border-border text-sm text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />

          <input
            type="text"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="Miktar (örn: 2 adet, 1 kg)"
            className="w-full sm:w-48 px-3.5 py-2.5 rounded-2xl bg-surface-raised border border-border text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:opacity-90 transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            Ekle
          </button>
        </div>
      </form>

      {/* Control Actions & Notifications */}
      {transferMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{transferMessage}</span>
          <button
            type="button"
            onClick={() => setTransferMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">
            {items.length > 0
              ? `${completedCount} / ${items.length} ürün alındı`
              : "Liste Boş"}
          </span>
          {items.length > 0 && (
            <span className="text-[11px] text-muted">
              (%{Math.round((completedCount / items.length) * 100)})
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {uncompletedCount > 0 && (
            <button
              type="button"
              onClick={handleCarryOver}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition cursor-pointer"
              title="Henüz alınmayan ürünleri sonraki haftanın alışveriş listesine aktar"
            >
              <span>➡️</span>
              <span>Sonraki Haftaya Aktar ({uncompletedCount})</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleCopyList}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-surface-raised hover:bg-border/40 text-xs font-semibold text-foreground transition cursor-pointer"
            >
              <span>{isCopied ? "✓" : "📋"}</span>
              <span>{isCopied ? "Kopyalandı!" : "Kopyala"}</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
              title="Tamamlananları temizle"
            >
              Alınanları Sil
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-foreground transition cursor-pointer"
              title="Haftalık listeyi sıfırla"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border/80 bg-surface/50 space-y-2">
          <span className="text-3xl sm:text-4xl block">🛒</span>
          <h4 className="text-base font-bold text-foreground">
            Bu hafta için alışveriş listesi boş
          </h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Yukarıdaki alandan ev veya market için alınacak ürünleri ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none group ${
                item.isCompleted
                  ? "bg-surface-raised/40 border-border/40 opacity-60"
                  : "bg-surface border-border/80 hover:border-primary/40 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border text-xs transition ${
                    item.isCompleted
                      ? "bg-primary border-primary text-primary-foreground font-bold"
                      : "border-border bg-surface group-hover:border-primary/60"
                  }`}
                >
                  {item.isCompleted && "✓"}
                </div>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-sm font-bold truncate ${
                      item.isCompleted
                        ? "line-through text-muted"
                        : "text-foreground"
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.quantity && (
                    <span className="text-xs text-muted mt-0.5 font-medium">
                      Miktar: <strong className="text-foreground/80">{item.quantity}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.isCompleted
                      ? "bg-surface-raised text-muted"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {item.isCompleted ? "Alındı" : "Alınacak"}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                  title="Sil"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
