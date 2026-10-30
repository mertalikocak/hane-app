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
import { PageHeader } from "@/components/ui/PageHeader";
import {
  WishlistIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
} from "@/components/ui/Icons";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleConfirmDelete = (id: string) => {
    deleteWishlistItem(id);
    setConfirmDeleteId(null);
    loadItems();
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
      <PageHeader
        title="Hane Wish List"
        subtitle="Ortak ev istekleri ve aile bireylerinin kişisel dilek listeleri yan yana."
        icon={<WishlistIcon size={20} />}
        badge={
          <span className="ds-badge ds-badge-primary">
            ✨ Hayaller & İstek Listesi
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="primary-button px-4 py-2 text-xs"
          >
            <PlusIcon size={15} />
            <span>Yeni İstek Ekle</span>
          </button>
        }
      />

      {/* Overview Stats & Filter Bar */}
      <div className="ds-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
        {/* Quick count chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted font-bold mr-1">Özet:</span>
          <span className="ds-badge ds-badge-neutral py-1 px-2.5 text-xs tabular-nums">
            <span>🎁</span> {totalCount} Toplam İstek
          </span>
          <span className="ds-badge ds-badge-warning py-1 px-2.5 text-xs tabular-nums">
            <span>⏳</span> {pendingCount} Bekleyen
          </span>
          <span className="ds-badge ds-badge-success py-1 px-2.5 text-xs tabular-nums">
            <span>✅</span> {completedCount} Alınan / Biten
          </span>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsteklerde ara..."
              className="field w-full sm:w-52 !pl-9 py-1.5 text-xs h-9"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="field text-xs font-semibold py-1.5 h-9 w-full sm:w-auto"
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
              className="ds-card flex flex-col overflow-hidden"
            >
              {/* Box Header */}
              <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-xl shadow-2xs">
                    {sec.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground truncate leading-tight">
                        {sec.title}
                      </h2>
                      {sec.id === activeProfile?.id && (
                        <span className="ds-badge ds-badge-primary text-[10px] px-1.5 py-0">
                          Sen
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted truncate block mt-0.5 tabular-nums">
                      {secPending} bekleyen • {secCompleted} tamamlandı
                    </span>
                  </div>
                </div>

                {/* Quick Add Button only for Hane or Active Profile */}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreate(sec.id)}
                    className="icon-button h-8 w-8 shrink-0"
                    title={`${sec.title} listesine ekle`}
                  >
                    <PlusIcon size={15} />
                  </button>
                )}
              </div>

              {/* Items List Inside Box */}
              <div className="p-3 sm:p-4 flex-1 space-y-2.5 overflow-y-auto max-h-[600px]">
                {secItems.length === 0 ? (
                  <div className="py-10 px-4 text-center space-y-2.5 rounded-xl border border-dashed border-border bg-surface-raised/50">
                    <span className="text-3xl opacity-80 block">🎁</span>
                    <p className="text-xs font-semibold text-foreground">
                      {searchQuery || filterCategory !== "all"
                        ? "Filtreye uygun istek bulunamadı"
                        : "Henüz istek eklenmedi"}
                    </p>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(sec.id)}
                        className="accent-button px-3 py-1.5 text-xs h-8 min-h-0"
                      >
                        <PlusIcon size={13} />
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
                        className={`rounded-xl border p-3.5 transition-all group flex flex-col justify-between gap-2.5 ${
                          isCompleted
                            ? "bg-emerald-500/5 border-emerald-500/25 opacity-75"
                            : "bg-surface-raised border-border hover:border-border-strong"
                        }`}
                      >
                        {/* Top: Checkbox, Title & Category */}
                        <div className="flex items-start gap-2.5">
                          {/* Tick Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggle(item.id)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition cursor-pointer ${
                              isCompleted
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-border-strong bg-surface hover:border-primary text-transparent"
                            }`}
                            title={isCompleted ? "Alınmadı olarak işaretle" : "Alındı / Tamamlandı olarak işaretle"}
                          >
                            <CheckIcon size={12} />
                          </button>

                          {/* Title & Notes */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                              >
                                {cat.icon} {cat.label}
                              </span>

                              {item.priority === "high" && (
                                <span className="ds-badge ds-badge-danger text-[9px] px-1.5 py-0">
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
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.price !== undefined && item.price > 0 && (
                              <span className="font-bold text-primary text-[11px] tabular-nums">
                                {para(item.price)}
                              </span>
                            )}

                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                              >
                                <span>🔗 Link</span>
                              </a>
                            )}
                          </div>

                          {canManage && (
                            <div className="flex items-center gap-1">
                              {confirmDeleteId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDelete(item.id)}
                                    className="danger-button px-2 py-0.5 text-[10px] h-6 min-h-0 bg-rose-600 text-white hover:bg-rose-700"
                                  >
                                    Sil
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="secondary-button px-2 py-0.5 text-[10px] h-6 min-h-0"
                                  >
                                    İptal
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(item)}
                                    className="h-7 w-7 rounded-lg bg-surface border border-border text-muted hover:text-foreground flex items-center justify-center transition cursor-pointer"
                                    title="Düzenle"
                                  >
                                    <EditIcon size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(item.id)}
                                    className="h-7 w-7 rounded-lg bg-surface border border-border text-muted hover:text-rose-600 hover:border-rose-500/30 flex items-center justify-center transition cursor-pointer"
                                    title="Sil"
                                  >
                                    <TrashIcon size={12} />
                                  </button>
                                </>
                              )}
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
