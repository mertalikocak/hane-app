"use client";

import React, { useState } from "react";
import {
  CLEANING_METHODS,
  CleaningMethodId,
  RoomStatus,
} from "@/domain/cleaningTypes";
import { saveCleaningRecord, deleteCleaningRoom } from "@/storage/cleaningStorage";
import { useProfile } from "@/context/ProfileContext";
import { CloseIcon, PlusIcon } from "@/components/ui/Icons";

interface RoomStatusCardsProps {
  roomStatuses: RoomStatus[];
  onOpenModalForRoom: (roomId: string) => void;
  onAddRoom?: () => void;
}

export function RoomStatusCards({
  roomStatuses,
  onOpenModalForRoom,
  onAddRoom,
}: RoomStatusCardsProps) {
  const { activeProfile } = useProfile();
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);

  const getMethodBadge = (methodId: CleaningMethodId) => {
    const found = CLEANING_METHODS.find((m) => m.id === methodId);
    if (!found) return null;
    return (
      <span
        key={methodId}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${found.badgeColor}`}
        title={found.label}
      >
        <span>{found.icon}</span>
        <span>{found.shortLabel}</span>
      </span>
    );
  };

  const getStatusBadge = (status: RoomStatus) => {
    if (status.daysAgo === null) {
      return (
        <span className="ds-badge ds-badge-neutral text-[11px]">
          Kayıt Yok
        </span>
      );
    }
    if (status.statusLevel === "fresh") {
      return (
        <span className="ds-badge ds-badge-success text-[11px]">
          🟢 {status.daysAgo === 0 ? "Bugün" : "Dün"}
        </span>
      );
    }
    if (status.statusLevel === "normal") {
      return (
        <span className="ds-badge ds-badge-primary text-[11px]">
          🔵 {status.daysAgo} gün önce
        </span>
      );
    }
    if (status.statusLevel === "due") {
      return (
        <span className="ds-badge ds-badge-warning text-[11px]">
          🟡 {status.daysAgo} gün önce (Zamanı Geldi)
        </span>
      );
    }
    return (
      <span className="ds-badge ds-badge-danger text-[11px]">
        🔴 {status.daysAgo} gün önce (Gecikti)
      </span>
    );
  };

  const handle1ClickClean = (
    e: React.MouseEvent,
    status: RoomStatus,
    methods: CleaningMethodId[]
  ) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split("T")[0];
    saveCleaningRecord({
      roomId: status.room.id,
      roomName: status.room.name,
      date: todayStr,
      methods,
      cleanedBy: activeProfile?.firstName || undefined,
      note: "Hızlı tek tık ile kaydedildi",
    });
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (roomStatuses.length === 0) {
    return (
      <div className="ds-card border-dashed p-10 text-center space-y-4">
        <div className="text-4xl">🏠✨</div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Henüz Hiç Oda Eklenmedi
          </h3>
          <p className="text-xs sm:text-sm text-muted">
            Tüm varsayılan odalar sıfırlandı. Evinizdeki odaları (Salon, Mutfak, Yatak Odası vb.) kendiniz belirleyip ekleyebilirsiniz.
          </p>
        </div>
        {onAddRoom && (
          <button
            type="button"
            onClick={onAddRoom}
            className="primary-button text-xs px-5 py-2.5"
          >
            <PlusIcon size={15} />
            <span>İlk Odayı Ekle</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {roomStatuses.map((status) => {
        const last = status.lastRecord;
        const isConfirmingDelete = confirmDeleteRoomId === status.room.id;

        return (
          <div
            key={status.room.id}
            onClick={() => onOpenModalForRoom(status.room.id)}
            className="ds-card-interactive flex flex-col justify-between p-4 sm:p-5 group relative overflow-hidden"
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-raised border border-border text-2xl shadow-2xs">
                  {status.room.icon}
                </span>
                <div className="flex items-center gap-1.5">
                  {isConfirmingDelete ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          deleteCleaningRoom(status.room.id);
                          setConfirmDeleteRoomId(null);
                        }}
                        className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-2 py-0.5 text-[10px] h-6 min-h-0"
                      >
                        Sil
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRoomId(null)}
                        className="secondary-button px-2 py-0.5 text-[10px] h-6 min-h-0"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <>
                      {getStatusBadge(status)}
                      <button
                        type="button"
                        title="Odayı Sil"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteRoomId(status.room.id);
                        }}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <CloseIcon size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {status.room.name}
              </h3>

              {/* Last cleaned description */}
              <div className="mt-2 text-xs text-muted min-h-[38px]">
                {last ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-foreground-secondary">
                      <span>Son:</span>
                      <span className="font-semibold text-foreground">
                        {formatDateDisplay(last.date)}
                      </span>
                      {last.cleanedBy && (
                        <span className="text-[11px] text-muted">
                          ({last.cleanedBy})
                        </span>
                      )}
                    </div>
                    {/* Method tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {last.methods.map((m) => getMethodBadge(m))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted italic text-[11px] pt-1">
                    Henüz temizlik kaydı girilmedi.
                  </p>
                )}
              </div>
            </div>

            {/* Quick 1-click bottom actions */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                {/* 1-tap Robot */}
                <button
                  type="button"
                  title="Bugün Robot Süpürge çalıştırıldı olarak kaydet"
                  onClick={(e) => handle1ClickClean(e, status, ["robot"])}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised border border-border hover:bg-accent hover:border-border-lavender text-xs transition cursor-pointer"
                >
                  🤖
                </button>
                {/* 1-tap Süpürge & Paspas */}
                <button
                  type="button"
                  title="Bugün Süpürüldü ve Paspas yapıldı olarak kaydet"
                  onClick={(e) => handle1ClickClean(e, status, ["vacuum", "mop"])}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised border border-border hover:bg-emerald-500/15 hover:border-emerald-500/30 text-xs transition cursor-pointer"
                >
                  🧹
                </button>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModalForRoom(status.room.id);
                }}
                className="accent-button px-2.5 py-1 text-[11px] h-7 min-h-0"
              >
                + Detaylı Kaydet
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
