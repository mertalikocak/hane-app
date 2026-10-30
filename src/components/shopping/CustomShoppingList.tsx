"use client";

import React, { useState } from "react";
import { ShoppingCustomItem } from "@/domain/shoppingTypes";
import {
  addCustomShoppingItem,
  toggleCustomShoppingItem,
  deleteCustomShoppingItem,
  clearCompletedCustomShopping,
  clearAllCustomShopping,
} from "@/storage/shoppingStorage";
import {
  WhatsAppIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

interface CustomShoppingListProps {
  weekStart?: string;
  items: ShoppingCustomItem[];
  onRefresh: () => void;
  onOpenWhatsApp?: () => void;
}

export function CustomShoppingList({
  items,
  onRefresh,
  onOpenWhatsApp,
}: CustomShoppingListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"completed" | "all" | null>(null);

  const completedCount = items.filter((i) => i.isCompleted).length;
  const progressPercent =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCustomShoppingItem({
      title: newTitle,
      quantity: newQuantity,
    });

    setNewTitle("");
    setNewQuantity("");
    onRefresh();
  };

  const handleToggle = (id: string) => {
    toggleCustomShoppingItem(id);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    deleteCustomShoppingItem(id);
    onRefresh();
  };

  const executeClearCompleted = () => {
    clearCompletedCustomShopping();
    setConfirmAction(null);
    onRefresh();
  };

  const executeClearAll = () => {
    clearAllCustomShopping();
    setConfirmAction(null);
    onRefresh();
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
        className="ds-card p-4 sm:p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            Yeni Ürün Ekle
          </span>
          <span className="text-xs text-muted hidden sm:inline">
            Örn: Zeytinyağı, Kağıt Havlu, Deterjan, Maden Suyu
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ne alınacak? (örn: Süt, Deterjan, Çöp Poşeti...)"
            className="field flex-1"
          />

          <input
            type="text"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="Miktar (örn: 2 adet, 1 kg)"
            className="field w-full sm:w-52"
          />

          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="primary-button px-5 shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Listeye Ekle</span>
          </button>
        </div>
      </form>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {items.length > 0
              ? `${completedCount} / ${items.length} ürün alındı`
              : "Liste Boş"}
          </span>
          {items.length > 0 && (
            <span className="inline-flex items-center rounded-md border border-border-lavender bg-surface-lavender px-2 py-0.5 text-xs font-semibold text-primary">
              %{progressPercent} tamamlandı
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Alınanları Temizle Butonu */}
          {confirmAction === "completed" ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-danger-border bg-danger-bg px-2.5 py-1">
              <span className="text-xs font-semibold text-danger">Alınanlar temizlensin mi?</span>
              <button
                type="button"
                onClick={executeClearCompleted}
                className="rounded-lg bg-danger px-2.5 py-1 text-xs font-bold text-white cursor-pointer"
              >
                Evet, Temizle
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-foreground-secondary hover:bg-surface cursor-pointer"
              >
                İptal
              </button>
            </div>
          ) : (
            completedCount > 0 && (
              <button
                type="button"
                onClick={() => setConfirmAction("completed")}
                className="secondary-button h-9 px-3 text-xs text-danger hover:border-danger-border hover:bg-danger-bg"
                title="Alınmış (tamamlanmış) ürünleri listeden temizle"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-danger" />
                <span>Alınanları Temizle ({completedCount})</span>
              </button>
            )
          )}

          {items.length > 0 && onOpenWhatsApp && (
            <button
              type="button"
              onClick={onOpenWhatsApp}
              className="secondary-button h-9 px-3 text-xs text-success border-success-border bg-success-bg hover:opacity-90"
              title="Listeyi WhatsApp ile paylaş"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-success" />
              <span>WhatsApp</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleCopyList}
              className="secondary-button h-9 px-3 text-xs"
            >
              {isCopied ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : null}
              <span>{isCopied ? "Kopyalandı!" : "Kopyala"}</span>
            </button>
          )}

          {confirmAction === "all" ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-danger-border bg-danger-bg px-2.5 py-1">
              <span className="text-xs font-semibold text-danger">Tüm liste silinsin mi?</span>
              <button
                type="button"
                onClick={executeClearAll}
                className="rounded-lg bg-danger px-2 py-1 text-xs font-bold text-white cursor-pointer"
              >
                Evet, Sıfırla
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-foreground-secondary hover:bg-surface cursor-pointer"
              >
                İptal
              </button>
            </div>
          ) : (
            items.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmAction("all")}
                className="ghost-button h-9 px-3 text-xs"
                title="Tüm listeyi temizle"
              >
                Tümünü Temizle
              </button>
            )
          )}
        </div>
      </div>

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <div className="ds-card p-8 sm:p-12 text-center space-y-2.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border-lavender bg-surface-lavender text-primary">
            <ShoppingBagIcon className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-foreground">
            Alışveriş listeniz boş
          </h4>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            Yukarıdaki alandan ev veya market için alınacak ürünleri ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none group ${
                item.isCompleted
                  ? "bg-surface-raised/60 border-border/60 opacity-65"
                  : "bg-surface border-border hover:border-border-lavender hover:shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    item.isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border-strong bg-surface group-hover:border-primary"
                  }`}
                >
                  {item.isCompleted && <CheckIcon className="h-3.5 w-3.5" />}
                </div>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-sm font-semibold truncate ${
                      item.isCompleted
                        ? "line-through text-muted"
                        : "text-foreground"
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.quantity && (
                    <span className="text-xs text-muted mt-0.5">
                      Miktar: <strong className="font-semibold text-foreground-secondary">{item.quantity}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    item.isCompleted
                      ? "border-border bg-surface-raised text-muted"
                      : "border-border-lavender bg-surface-lavender text-primary"
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
                  className="opacity-100 sm:opacity-70 sm:group-hover:opacity-100 p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger-bg transition cursor-pointer"
                  title="Ürünü Sil"
                  aria-label={`${item.title} ürününü sil`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
