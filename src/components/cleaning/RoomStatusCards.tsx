"use client";

import React from "react";
import {
  CLEANING_METHODS,
  CleaningMethodId,
  RoomStatus,
} from "@/domain/cleaningTypes";
import { saveCleaningRecord, deleteCleaningRoom } from "@/storage/cleaningStorage";
import { useProfile } from "@/context/ProfileContext";

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

  const getMethodBadge = (methodId: CleaningMethodId) => {
    const found = CLEANING_METHODS.find((m) => m.id === methodId);
    if (!found) return null;
    return (
      <span
        key={methodId}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold border ${found.badgeColor}`}
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
        <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 border border-slate-500/20">
          Kayıt Yok
        </span>
      );
    }
    if (status.statusLevel === "fresh") {
      return (
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          🟢 {status.daysAgo === 0 ? "Bugün" : "Dün"}
        </span>
      );
    }
    if (status.statusLevel === "normal") {
      return (
        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          🔵 {status.daysAgo} gün önce
        </span>
      );
    }
    if (status.statusLevel === "due") {
      return (
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          🟡 {status.daysAgo} gün önce (Zamanı Geldi)
        </span>
      );
    }
    return (
      <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
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
      <div className="rounded-3xl border border-dashed border-border/80 bg-surface/50 p-10 text-center space-y-4">
        <div className="text-5xl">🏠✨</div>
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
            className="primary-button text-xs px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
          >
            <span>+</span>
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
        return (
          <div
            key={status.room.id}
            onClick={() => onOpenModalForRoom(status.room.id)}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised border border-border/60 text-2xl shadow-xs group-hover:scale-110 transition-transform">
                  {status.room.icon}
                </span>
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(status)}
                  <button
                    type="button"
                    title="Odayı Sil"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`"${status.room.name}" odasını silmek istediğinize emin misiniz?`)) {
                        deleteCleaningRoom(status.room.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {status.room.name}
              </h3>

              {/* Last cleaned description */}
              <div className="mt-2 text-xs text-muted min-h-[38px]">
                {last ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-foreground/80">
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
                  <p className="text-muted/70 italic text-[11px] pt-1">
                    Henüz temizlik kaydı girilmedi.
                  </p>
                )}
              </div>
            </div>

            {/* Quick 1-click bottom actions */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                {/* 1-tap Robot */}
                <button
                  type="button"
                  title="Bugün Robot Süpürge çalıştırıldı olarak kaydet"
                  onClick={(e) => handle1ClickClean(e, status, ["robot"])}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised border border-border/60 hover:bg-cyan-500/20 hover:border-cyan-500/30 text-xs transition active:scale-95 cursor-pointer"
                >
                  🤖
                </button>
                {/* 1-tap Süpürge & Paspas */}
                <button
                  type="button"
                  title="Bugün Süpürüldü ve Paspas yapıldı olarak kaydet"
                  onClick={(e) => handle1ClickClean(e, status, ["vacuum", "mop"])}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised border border-border/60 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-xs transition active:scale-95 cursor-pointer"
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
                className="text-[11px] font-bold text-primary hover:text-primary-hover px-2 py-1 rounded-lg hover:bg-primary/10 transition cursor-pointer"
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
