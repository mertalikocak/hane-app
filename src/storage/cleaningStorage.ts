import {
  CleaningRecord,
  CleaningRoom,
  DEFAULT_ROOMS,
  RoomStatus,
  CleaningMethodId,
} from "@/domain/cleaningTypes";

export const CLEANING_RECORDS_KEY = "hane_cleaning_records";
export const CLEANING_ROOMS_KEY = "hane_cleaning_rooms";
export const CLEANING_EVENT_NAME = "hane_cleaning_updated";

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CLEANING_EVENT_NAME));
    window.dispatchEvent(new Event("storage"));
  }
}

// -------------------------------------------------------------
// ROOMS
// -------------------------------------------------------------
const CLEANING_RESET_KEY = "hane_cleaning_reset_done";

export function getCleaningRooms(): CleaningRoom[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    // One-time reset requested by user so they can add rooms manually
    if (localStorage.getItem(CLEANING_RESET_KEY) !== "true") {
      localStorage.setItem(CLEANING_ROOMS_KEY, JSON.stringify([]));
      localStorage.setItem(CLEANING_RESET_KEY, "true");
      return [];
    }

    const raw = localStorage.getItem(CLEANING_ROOMS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: CleaningRoom[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading cleaning rooms from localStorage", err);
    return [];
  }
}

export function clearAllCleaningRooms(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(CLEANING_ROOMS_KEY, JSON.stringify([]));
    localStorage.setItem(CLEANING_RESET_KEY, "true");
    notifyChange();
  } catch (err) {
    console.error("Error clearing cleaning rooms", err);
  }
}

export function saveCleaningRooms(rooms: CleaningRoom[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(CLEANING_ROOMS_KEY, JSON.stringify(rooms));
    notifyChange();
  } catch (err) {
    console.error("Error saving cleaning rooms", err);
  }
}

export function addCleaningRoom(room: Omit<CleaningRoom, "id"> & { id?: string }): CleaningRoom {
  const rooms = getCleaningRooms();
  const newRoom: CleaningRoom = {
    ...room,
    id: room.id || `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    targetDaysInterval: room.targetDaysInterval ?? 3,
  };
  rooms.push(newRoom);
  saveCleaningRooms(rooms);
  return newRoom;
}

export function deleteCleaningRoom(roomId: string): boolean {
  const rooms = getCleaningRooms();
  const nextRooms = rooms.filter((r) => r.id !== roomId);
  if (nextRooms.length === rooms.length) return false;
  saveCleaningRooms(nextRooms);
  return true;
}

// -------------------------------------------------------------
// RECORDS
// -------------------------------------------------------------
export function getCleaningRecords(): CleaningRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(CLEANING_RECORDS_KEY);
    if (!raw) return [];
    const list: CleaningRecord[] = JSON.parse(raw);
    return list.sort((a, b) => {
      // Sort by date desc, then createdAt desc
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  } catch (err) {
    console.error("Error reading cleaning records from localStorage", err);
    return [];
  }
}

export function saveCleaningRecord(
  recordInput: Omit<CleaningRecord, "id" | "createdAt"> & { id?: string; createdAt?: string }
): CleaningRecord {
  const list = getCleaningRecords();
  const now = new Date().toISOString();

  let saved: CleaningRecord;

  if (recordInput.id) {
    const idx = list.findIndex((r) => r.id === recordInput.id);
    if (idx >= 0) {
      saved = {
        ...list[idx],
        ...recordInput,
        id: recordInput.id,
        createdAt: list[idx].createdAt || now,
      };
      list[idx] = saved;
    } else {
      saved = {
        ...recordInput,
        id: recordInput.id,
        createdAt: recordInput.createdAt || now,
      };
      list.unshift(saved);
    }
  } else {
    saved = {
      ...recordInput,
      id: `clean_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
    };
    list.unshift(saved);
  }

  try {
    localStorage.setItem(CLEANING_RECORDS_KEY, JSON.stringify(list));
    notifyChange();
  } catch (err) {
    console.error("Error saving cleaning record", err);
  }

  return saved;
}

export function deleteCleaningRecord(id: string): boolean {
  const list = getCleaningRecords();
  const filtered = list.filter((r) => r.id !== id);
  if (filtered.length === list.length) return false;

  try {
    localStorage.setItem(CLEANING_RECORDS_KEY, JSON.stringify(filtered));
    notifyChange();
    return true;
  } catch (err) {
    console.error("Error deleting cleaning record", err);
    return false;
  }
}

// -------------------------------------------------------------
// STATUS & STATS CALCULATIONS
// -------------------------------------------------------------
export function calculateDaysBetween(targetDateStr: string, baseDate: Date = new Date()): number {
  const [year, month, day] = targetDateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diffTime = base.getTime() - target.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getRoomStatuses(): RoomStatus[] {
  const rooms = getCleaningRooms();
  const records = getCleaningRecords();

  return rooms.map((room) => {
    const roomRecords = records.filter((r) => r.roomId === room.id);
    const lastRecord = roomRecords[0]; // records are sorted by date desc

    if (!lastRecord) {
      return {
        room,
        lastRecord: undefined,
        daysAgo: null,
        statusLevel: "due",
      };
    }

    const daysAgo = calculateDaysBetween(lastRecord.date);
    const targetInterval = room.targetDaysInterval ?? 3;

    let statusLevel: RoomStatus["statusLevel"] = "normal";
    if (daysAgo <= 1) {
      statusLevel = "fresh";
    } else if (daysAgo <= targetInterval) {
      statusLevel = "normal";
    } else if (daysAgo <= targetInterval + 2) {
      statusLevel = "due";
    } else {
      statusLevel = "overdue";
    }

    return {
      room,
      lastRecord,
      daysAgo,
      statusLevel,
    };
  });
}

export interface CleaningStats {
  cleanedTodayCount: number;
  cleanedThisWeekCount: number;
  totalRecordsCount: number;
  freshRoomsCount: number;
  dueRoomsCount: number;
  lastCleanedRoomName?: string;
  lastCleanedDate?: string;
}

export function getCleaningStats(): CleaningStats {
  const records = getCleaningRecords();
  const roomStatuses = getRoomStatuses();

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  const mondayStr = monday.toISOString().split("T")[0];

  const cleanedTodayCount = records.filter((r) => r.date === todayStr).length;
  const cleanedThisWeekCount = records.filter((r) => r.date >= mondayStr && r.date <= todayStr).length;

  const freshRoomsCount = roomStatuses.filter((s) => s.statusLevel === "fresh").length;
  const dueRoomsCount = roomStatuses.filter((s) => s.statusLevel === "due" || s.statusLevel === "overdue").length;

  const latestRecord = records[0];

  return {
    cleanedTodayCount,
    cleanedThisWeekCount,
    totalRecordsCount: records.length,
    freshRoomsCount,
    dueRoomsCount,
    lastCleanedRoomName: latestRecord?.roomName,
    lastCleanedDate: latestRecord?.date,
  };
}
