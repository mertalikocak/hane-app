"use client";

import React, { useState } from "react";
import {
  CLEANING_METHODS,
  CleaningMethodId,
  CleaningRecord,
  CleaningRoom,
} from "@/domain/cleaningTypes";
import { deleteCleaningRecord } from "@/storage/cleaningStorage";
import { TrashIcon } from "@/components/ui/Icons";

interface CleaningHistoryListProps {
  records: CleaningRecord[];
  rooms: CleaningRoom[];
}

export function CleaningHistoryList({
  records,
  rooms,
}: CleaningHistoryListProps) {
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [selectedMethodFilter, setSelectedMethodFilter] =
    useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const filteredRecords = records.filter((r) => {
    if (selectedRoomFilter !== "all" && r.roomId !== selectedRoomFilter) {
      return false;
    }
    if (
      selectedMethodFilter !== "all" &&
      !r.methods.includes(selectedMethodFilter as CleaningMethodId)
    ) {
      return false;
    }
    return true;
  });

  const handleConfirmDelete = (id: string) => {
    deleteCleaningRecord(id);
    setConfirmDeleteId(null);
  };

  const getMethodBadge = (methodId: CleaningMethodId) => {
    const found = CLEANING_METHODS.find((m) => m.id === methodId);
    if (!found) return null;
    return (
      <span
        key={methodId}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${found.badgeColor}`}
      >
        <span>{found.icon}</span>
        <span>{found.label}</span>
      </span>
    );
  };

  const formatHeaderDate = (dateStr: string) => {
    if (dateStr === todayStr) return "Bugün";
    if (dateStr === yesterdayStr) return "Dün";
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Group records by date
  const groupedByDate: Record<string, CleaningRecord[]> = {};
  filteredRecords.forEach((r) => {
    if (!groupedByDate[r.date]) {
      groupedByDate[r.date] = [];
    }
    groupedByDate[r.date].push(r);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="ds-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Room filter */}
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="field h-9 text-xs py-1 px-3 w-auto min-w-[140px]"
          >
            <option value="all">Tüm Odalar ({records.length})</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.icon} {room.name}
              </option>
            ))}
          </select>

          {/* Method filter */}
          <select
            value={selectedMethodFilter}
            onChange={(e) => setSelectedMethodFilter(e.target.value)}
            className="field h-9 text-xs py-1 px-3 w-auto min-w-[140px]"
          >
            <option value="all">Tüm Temizlik Yöntemleri</option>
            {CLEANING_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-muted font-medium self-end sm:self-center tabular-nums">
          {filteredRecords.length} Kayıt Gösteriliyor
        </span>
      </div>

      {/* History timeline list */}
      {sortedDates.length === 0 ? (
        <div className="ds-card border-dashed p-10 text-center space-y-3">
          <div className="text-4xl">🧹✨</div>
          <h4 className="text-sm font-bold text-foreground">
            Temizlik kaydı bulunamadı
          </h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {records.length === 0
              ? "Henüz hiç oda temizliği kaydedilmemiş. Yukarıdaki odalardan birine tıklayarak veya '+ Temizlik Kaydet' butonundan ilk kaydınızı oluşturun."
              : "Seçili filtrelere uygun temizlik kaydı bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dateRecords = groupedByDate[dateStr];
            return (
              <div key={dateStr} className="space-y-2.5">
                {/* Date Header Pill */}
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-surface-raised border border-border px-3 py-1 text-xs font-bold text-foreground">
                    📅 {formatHeaderDate(dateStr)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] text-muted tabular-nums">
                    {dateRecords.length} Oda
                  </span>
                </div>

                {/* Records under this date */}
                <div className="grid grid-cols-1 gap-2.5">
                  {dateRecords.map((record) => {
                    const room = rooms.find((r) => r.id === record.roomId);
                    const roomIcon = room?.icon || "🏠";

                    return (
                      <div
                        key={record.id}
                        className="ds-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4"
                      >
                        {/* Left: Room & Methods */}
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-raised border border-border text-xl shadow-2xs">
                            {roomIcon}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">
                                {record.roomName}
                              </span>
                              {record.cleanedBy && (
                                <span className="ds-badge ds-badge-neutral text-[11px]">
                                  👤 {record.cleanedBy}
                                </span>
                              )}
                            </div>

                            {/* Method Badges */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {record.methods.map((m) => getMethodBadge(m))}
                            </div>

                            {record.note && (
                              <p className="text-xs text-muted italic">
                                💬 &quot;{record.note}&quot;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Date / Action */}
                        <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                          {confirmDeleteId === record.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(record.id)}
                                className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-2.5 py-1 text-xs h-7 min-h-0"
                              >
                                Sil
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="secondary-button px-2.5 py-1 text-xs h-7 min-h-0"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              title="Kaydı Sil"
                              onClick={() => setConfirmDeleteId(record.id)}
                              className="icon-button h-8 w-8 text-muted hover:text-rose-600"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
