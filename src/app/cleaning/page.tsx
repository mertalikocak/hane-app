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
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CleaningIcon,
  PlusIcon,
  BellIcon,
  TrashIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

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
  const [confirmResetRooms, setConfirmResetRooms] = useState(false);

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

  const handleConfirmResetRooms = () => {
    clearAllCleaningRooms();
    setConfirmResetRooms(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Hane Cleaning"
        subtitle="Hangi oda ne zaman, süpürge, paspas veya robot ile temizlendi takip edin."
        icon={<CleaningIcon size={20} />}
        badge={
          <span className="ds-badge ds-badge-primary">
            Temizlik Takibi
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {rooms.length > 0 && (
              confirmResetRooms ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleConfirmResetRooms}
                    className="danger-button bg-rose-600 text-white hover:bg-rose-700 text-xs px-3 py-2"
                  >
                    Sıfırlamayı Onayla
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetRooms(false)}
                    className="secondary-button text-xs px-2.5 py-2"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  title="Kayıtlı tüm odaları silip baştan başla"
                  onClick={() => setConfirmResetRooms(true)}
                  className="secondary-button text-xs px-2.5 py-2 text-muted hover:text-rose-600"
                >
                  <TrashIcon size={14} />
                  <span className="hidden sm:inline">Odaları Sıfırla</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setIsReminderOpen(true)}
              title="Temizlik Bildirimi Ayarları (Her gün 12:00)"
              className="secondary-button text-xs px-3 py-2"
            >
              <BellIcon size={14} />
              <span className="hidden sm:inline">12:00 Bildirimi</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddRoomOpen(true)}
              className="secondary-button text-xs px-3.5 py-2"
            >
              <PlusIcon size={14} />
              <span>Oda Ekle</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="primary-button text-xs px-4 py-2"
            >
              <SparklesIcon size={14} />
              <span>Temizlik Kaydet</span>
            </button>
          </div>
        }
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ds-card p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Bugün Temizlenen
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700">
              {stats.cleanedTodayCount}
            </span>
            <span className="text-xs text-muted">oda</span>
          </div>
        </div>

        <div className="ds-card p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Bu Hafta Toplam
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="text-xl sm:text-2xl font-bold text-primary">
              {stats.cleanedThisWeekCount}
            </span>
            <span className="text-xs text-muted">temizlik</span>
          </div>
        </div>

        <div className="ds-card p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Tertemiz Odalar
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700">
              {stats.freshRoomsCount}
            </span>
            <span className="text-xs text-muted">/ {rooms.length}</span>
          </div>
        </div>

        <div className="ds-card p-3.5 sm:p-4">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Temizlik Bekleyen
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="text-xl sm:text-2xl font-bold text-amber-700">
              {stats.dueRoomsCount}
            </span>
            <span className="text-xs text-muted">oda</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("rooms")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "rooms"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>🏠</span>
            <span>Oda Durumları</span>
            <span className="ds-badge ds-badge-neutral text-xs tabular-nums">
              {rooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>📜</span>
            <span>Temizlik Geçmişi</span>
            <span className="ds-badge ds-badge-neutral text-xs tabular-nums">
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
