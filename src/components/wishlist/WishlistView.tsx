"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  WishlistItem,
  WISHLIST_CATEGORIES,
} from "@/domain/wishlistTypes";
import {
  getWishlistItems,
  toggleWishlistItem,
  deleteWishlistItem,
} from "@/storage/wishlistStorage";
import { WishlistModal } from "./WishlistModal";
import { useProfile } from "@/context/ProfileContext";

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

export function WishlistView() {
  const { profiles, activeProfile } = useProfile();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [modalDefaultSection, setModalDefaultSection] = useState<string>("hane");

  const loadItems = () => {
    setItems(getWishlistItems());
  };

  useEffect(() => {
    loadItems();
    const handleUpdate = () => loadItems();
    window.addEventListener("wishlist_items_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("wishlist_items_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Summary counts
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const pendingCount = totalCount - completedCount;

  // The sections: 1 for Hane + 1 for each profile (profile count + 1)
  const sections = useMemo(() => {
    const list = [
      {
        id: "hane",
        title: "Hane (Ortak)",
        subtitle: "Tüm aile için ortak istekler",
        icon: "🏠",
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        headerBorder: "border-amber-500/30",
      },
    ];

    // Sort profiles so activeProfile comes first after "hane"
    const sortedProfiles = [...profiles].sort((a, b) => {
      if (a.id === activeProfile?.id) return -1;
      if (b.id === activeProfile?.id) return 1;
      return 0;
    });

    sortedProfiles.forEach((p) => {
      list.push({
        id: p.id,
        title: `${p.firstName} ${p.lastName}`.trim(),
        subtitle: `${p.firstName}'in kişisel istek listesi`,
        icon: p.gender === "male" ? "👨" : "👩",
        gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
        badgeColor: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        headerBorder: "border-rose-500/30",
      });
    });

    return list;
  }, [profiles, activeProfile]);

  const handleOpenCreate = (sectionId?: string) => {
    setEditingItem(null);
    setModalDefaultSection(sectionId || (activeProfile ? activeProfile.id : "hane"));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setModalDefaultSection(item.targetSection);
    setIsModalOpen(true);
  };

  const handleToggle = (id: string) => {
    toggleWishlistItem(id);
    loadItems();
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`"${title}" isteğini silmek istediğinize emin misiniz?`)) {
      deleteWishlistItem(id);
      loadItems();
    }
  };

  // Helper to filter and sort items for a specific section
  const getItemsForSection = (sectionId: string) => {
    return items
      .filter((item) => {
        if (item.targetSection !== sectionId) return false;
        if (filterCategory !== "all" && item.category !== filterCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Uncompleted first, completed last
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-amber-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
              <span>✨</span> Hayaller & İstek Listesi
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Hane Wish List
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/90 font-medium">
              Ortak ev istekleri ve aile bireylerinin kişisel dilek listeleri yan yana.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenCreate()}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-rose-600 font-extrabold text-xs sm:text-sm shadow-lg hover:bg-white/95 active:scale-98 transition cursor-pointer"
            >
              <span>+</span>
              <span>Yeni İstek Ekle</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 h-48 w-48 rounded-full bg-rose-300/20 blur-xl pointer-events-none" />
      </section>

      {/* Overview Stats & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/90 border border-border/80 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xs">
        {/* Quick count chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted font-bold mr-1">Özet:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-border/60 text-xs font-bold text-foreground">
            <span>🎁</span> {totalCount} Toplam İstek
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>⏳</span> {pendingCount} Bekleyen
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>✅</span> {completedCount} Alınan / Biten
          </span>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsteklerde ara..."
              className="field w-40 sm:w-52 pl-8 py-1.5 text-xs font-medium"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="field text-xs font-semibold py-1.5"
          >
            <option value="all">Tüm Kategoriler</option>
            {Object.values(WISHLIST_CATEGORIES).map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Board: Profile Count + 1 Columns/Boxes */}
      <div
        className={`grid grid-cols-1 gap-5 ${
          sections.length === 2
            ? "md:grid-cols-2"
            : sections.length === 3
            ? "md:grid-cols-2 lg:grid-cols-3"
            : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }`}
      >
        {sections.map((sec) => {
          const secItems = getItemsForSection(sec.id);
          const secTotal = items.filter((i) => i.targetSection === sec.id).length;
          const secCompleted = items.filter((i) => i.targetSection === sec.id && i.completed).length;
          const secPending = secTotal - secCompleted;
          const canManage = sec.id === "hane" || sec.id === activeProfile?.id;

          return (
            <div
              key={sec.id}
              className="flex flex-col rounded-3xl border border-border/80 bg-surface shadow-xs hover:shadow-md transition-all overflow-hidden"
            >
              {/* Box Header */}
              <div
                className={`p-4 sm:p-5 border-b border-border/70 bg-gradient-to-b ${sec.gradient} flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface border border-border/70 text-2xl shadow-xs">
                    {sec.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-foreground truncate leading-tight">
                        {sec.title}
                      </h2>
                      {sec.id === activeProfile?.id && (
                        <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                          Sen
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted truncate block mt-0.5">
                      {secPending} bekleyen • {secCompleted} tamamlandı
                    </span>
                  </div>
                </div>

                {/* Quick Add Button only for Hane or Active Profile */}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreate(sec.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/80 text-foreground hover:bg-surface-raised hover:text-rose-600 text-sm font-bold shadow-xs transition cursor-pointer"
                    title={`${sec.title} listesine ekle`}
                  >
                    +
                  </button>
                )}
              </div>

              {/* Items List Inside Box (Alt Alta) */}
              <div className="p-3 sm:p-4 flex-1 space-y-2.5 overflow-y-auto max-h-[600px]">
                {secItems.length === 0 ? (
                  <div className="py-10 px-4 text-center space-y-2.5 rounded-2xl border border-dashed border-border/60 bg-surface-raised/30">
                    <span className="text-3xl opacity-70">🎁</span>
                    <p className="text-xs font-semibold text-foreground">
                      {searchQuery || filterCategory !== "all"
                        ? "Filtreye uygun istek bulunamadı"
                        : "Henüz istek eklenmedi"}
                    </p>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(sec.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
                      >
                        <span>+</span>
                        <span>İstek Ekle</span>
                      </button>
                    )}
                  </div>
                ) : (
                  secItems.map((item) => {
                    const cat = WISHLIST_CATEGORIES[item.category || "home"] || WISHLIST_CATEGORIES.home;
                    const isCompleted = item.completed;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3.5 transition-all shadow-2xs group flex flex-col justify-between gap-2.5 ${
                          isCompleted
                            ? "bg-emerald-500/5 border-emerald-500/30 opacity-70"
                            : "bg-surface-raised/70 border-border/70 hover:border-rose-500/40 hover:bg-surface-raised hover:shadow-xs"
                        }`}
                      >
                        {/* Top: Checkbox, Title & Category */}
                        <div className="flex items-start gap-2.5">
                          {/* Tick Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggle(item.id)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                              isCompleted
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                                : "border-border bg-surface hover:border-emerald-500 text-transparent"
                            }`}
                            title={isCompleted ? "Alınmadı olarak işaretle" : "Alındı / Tamamlandı olarak işaretle"}
                          >
                            ✓
                          </button>

                          {/* Title & Notes */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span
                                className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                              >
                                {cat.icon} {cat.label}
                              </span>

                              {item.priority === "high" && (
                                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  🔥 Yüksek
                                </span>
                              )}
                            </div>

                            <h3
                              className={`text-xs sm:text-sm font-bold leading-snug transition-all ${
                                isCompleted
                                  ? "line-through text-muted"
                                  : "text-foreground"
                              }`}
                            >
                              {item.title}
                            </h3>

                            {item.description && (
                              <p className="text-[11px] text-muted mt-1 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Price, Link & Action buttons */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.price !== undefined && item.price > 0 && (
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                                {para(item.price)}
                              </span>
                            )}

                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                              >
                                <span>🔗 Link</span>
                              </a>
                            )}
                          </div>

                          {canManage && (
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="h-6 w-6 rounded-lg bg-surface border border-border/60 text-muted hover:text-foreground text-[10px] flex items-center justify-center transition cursor-pointer"
                                title="Düzenle"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id, item.title)}
                                className="h-6 w-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-[10px] flex items-center justify-center transition cursor-pointer"
                                title="Sil"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialItem={editingItem}
        defaultSection={modalDefaultSection}
        onSaved={loadItems}
      />
    </div>
  );
}
