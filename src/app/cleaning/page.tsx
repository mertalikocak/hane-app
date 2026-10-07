"use client";

import React, { useState, useEffect } from "react";
import {
  CleaningRecord,
  CleaningRoom,
  RoomStatus,
} from "@/domain/cleaningTypes";
import {
  CLEANING_EVENT_NAME,
  getCleaningRecords,
  getCleaningRooms,
  getCleaningStats,
  getRoomStatuses,
  clearAllCleaningRooms,
} from "@/storage/cleaningStorage";
import { RoomStatusCards } from "@/components/cleaning/RoomStatusCards";
import { CleaningHistoryList } from "@/components/cleaning/CleaningHistoryList";
import { QuickCleanModal } from "@/components/cleaning/QuickCleanModal";
import { AddRoomModal } from "@/components/cleaning/AddRoomModal";
import { CleaningReminderModal } from "@/components/cleaning/CleaningReminderModal";
import {
  getCleaningReminderConfig,
  CLEANING_REMINDER_EVENT,
} from "@/lib/notifications/cleaningNotificationService";

export default function CleaningPage() {
  const [rooms, setRooms] = useState<CleaningRoom[]>([]);
  const [records, setRecords] = useState<CleaningRecord[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [stats, setStats] = useState({
    cleanedTodayCount: 0,
    cleanedThisWeekCount: 0,
    totalRecordsCount: 0,
    freshRoomsCount: 0,
    dueRoomsCount: 0,
  });

  const [activeTab, setActiveTab] = useState<"rooms" | "history">("rooms");
  const [isQuickCleanOpen, setIsQuickCleanOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [selectedRoomForModal, setSelectedRoomForModal] = useState<string | undefined>(undefined);

  const loadData = () => {
    const currentRooms = getCleaningRooms();
    const currentRecords = getCleaningRecords();
    const currentStatuses = getRoomStatuses();
    const currentStats = getCleaningStats();

    setRooms(currentRooms);
    setRecords(currentRecords);
    setRoomStatuses(currentStatuses);
    setStats(currentStats);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener(CLEANING_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(CLEANING_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleOpenModal = (roomId?: string) => {
    setSelectedRoomForModal(roomId);
    setIsQuickCleanOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-2xl shadow-md text-white">
            🧹
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Hane Cleaning
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Temizlik Takibi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted">
              Hangi oda ne zaman, süpürge, paspas veya robot ile temizlendi takip edin
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {rooms.length > 0 && (
            <button
              type="button"
              title="Kayıtlı tüm odaları silip baştan başla"
              onClick={() => {
                if (window.confirm("Kayıtlı tüm odaları sıfırlamak istediğinize emin misiniz? Odaları baştan kendiniz ekleyebileceksiniz.")) {
                  clearAllCleaningRooms();
                }
              }}
              className="secondary-button text-xs px-2.5 py-2 text-muted hover:text-rose-500 hover:border-rose-300 transition cursor-pointer"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Odaları Sıfırla</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsReminderOpen(true)}
            title="Temizlik Bildirimi Ayarları (Her gün 12:00)"
            className="secondary-button text-xs px-2.5 py-2.5 text-foreground hover:border-emerald-500/50 transition cursor-pointer"
          >
            <span>🔔</span>
            <span className="hidden sm:inline">12:00 Bildirimi</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddRoomOpen(true)}
            className="secondary-button text-xs px-3.5 py-2.5"
          >
            <span>+</span>
            <span>Oda Ekle</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="primary-button text-xs px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
          >
            <span>✨</span>
            <span>Temizlik Kaydet</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border/70 bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Bugün Temizlenen
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.cleanedTodayCount}
            </span>
            <span className="text-xs text-muted">oda</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Bu Hafta Toplam
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {stats.cleanedThisWeekCount}
            </span>
            <span className="text-xs text-muted">temizlik</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Tertemiz Odalar
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-500">
              {stats.freshRoomsCount}
            </span>
            <span className="text-xs text-muted">/ {rooms.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Temizlik Bekleyen
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-500">
              {stats.dueRoomsCount}
            </span>
            <span className="text-xs text-muted">oda</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-border/80">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("rooms")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "rooms"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>🏠</span>
            <span>Oda Durumları</span>
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted border border-border/60">
              {rooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "history"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>📜</span>
            <span>Temizlik Geçmişi</span>
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted border border-border/60">
              {records.length}
            </span>
          </button>
        </div>

        <span className="hidden sm:inline text-xs text-muted">
          Odalara tıklayarak hızlıca kayıt ekleyin
        </span>
      </div>

      {/* Tab Contents */}
      {activeTab === "rooms" ? (
        <div className="space-y-4">
          <RoomStatusCards
            roomStatuses={roomStatuses}
            onOpenModalForRoom={(roomId) => handleOpenModal(roomId)}
            onAddRoom={() => setIsAddRoomOpen(true)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <CleaningHistoryList records={records} rooms={rooms} />
        </div>
      )}

      {/* Modals */}
      <QuickCleanModal
        isOpen={isQuickCleanOpen}
        onClose={() => setIsQuickCleanOpen(false)}
        rooms={rooms}
        initialRoomId={selectedRoomForModal}
        onOpenAddRoom={() => setIsAddRoomOpen(true)}
      />

      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
      />

      <CleaningReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />
    </div>
  );
}
