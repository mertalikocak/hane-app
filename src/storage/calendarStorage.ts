import { CalendarEvent } from "@/domain/calendarTypes";

const CALENDAR_STORAGE_KEY = "hane_calendar_events";

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export function getCalendarEvents(): CalendarEvent[] {
  return safeGetItem<CalendarEvent[]>(CALENDAR_STORAGE_KEY, []);
}

export function getCalendarEventById(id: string): CalendarEvent | null {
  const events = getCalendarEvents();
  return events.find((e) => e.id === id) || null;
}

export function saveCalendarEvent(
  eventData: Omit<CalendarEvent, "id" | "createdAt"> & { id?: string }
): CalendarEvent {
  const events = getCalendarEvents();
  const now = new Date().toISOString();

  if (eventData.id) {
    const existingIndex = events.findIndex((e) => e.id === eventData.id);
    if (existingIndex >= 0) {
      const updated: CalendarEvent = {
        ...events[existingIndex],
        ...eventData,
        id: eventData.id,
        updatedAt: now,
      };
      events[existingIndex] = updated;
      safeSetItem(CALENDAR_STORAGE_KEY, events);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("calendar_events_updated"));
      }
      return updated;
    }
  }

  const newEvent: CalendarEvent = {
    ...eventData,
    id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
  };

  events.push(newEvent);
  safeSetItem(CALENDAR_STORAGE_KEY, events);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("calendar_events_updated"));
  }

  return newEvent;
}

export function deleteCalendarEvent(id: string): void {
  const events = getCalendarEvents().filter((e) => e.id !== id);
  safeSetItem(CALENDAR_STORAGE_KEY, events);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("calendar_events_updated"));
  }
}

export function getEventsForDate(dateStr: string): CalendarEvent[] {
  const events = getCalendarEvents();
  return events.filter((e) => {
    if (e.date === dateStr) return true;
    if (e.endDate && e.date <= dateStr && dateStr <= e.endDate) return true;
    return false;
  });
}
