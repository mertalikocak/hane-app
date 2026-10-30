"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarEvent,
  CALENDAR_CATEGORIES,
} from "@/domain/calendarTypes";
import { getCalendarEvents } from "@/storage/calendarStorage";
import { CalendarEventModal } from "./CalendarEventModal";
import { CalendarAiModal } from "./CalendarAiModal";
import { TodayEventBanner } from "./TodayEventBanner";
import { NotificationBellButton } from "@/components/notifications/NotificationBellButton";
import { useProfile } from "@/context/ProfileContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  SparklesIcon,
  ClockIcon,
  UserIcon,
} from "@/components/ui/Icons";

type ViewMode = "month" | "week";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const FULL_DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export function CalendarView() {
  const { profiles } = useProfile();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [filterProfileId, setFilterProfileId] = useState<string>("all"); // "all" | "common" | profileId

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>("");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const loadEvents = () => {
    const list = getCalendarEvents();
    setEvents(list);
  };

  useEffect(() => {
    loadEvents();
    const handleUpdate = () => loadEvents();
    window.addEventListener("calendar_events_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("calendar_events_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Filtered events based on filterProfileId
  const filteredEvents = useMemo(() => {
    if (filterProfileId === "all") return events;
    if (filterProfileId === "common") return events.filter((e) => e.scope === "common");
    return events.filter(
      (e) =>
        (e.scope === "personal" && e.targetProfileId === filterProfileId) ||
        (e.scope === "personal" && e.createdByProfileId === filterProfileId)
    );
  }, [events, filterProfileId]);

  // Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const searchParams = useSearchParams();
  const isShortcut = searchParams.get("shortcut") === "today";

  const todayEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.date === todayStr) return true;
      if (e.endDate && e.date <= todayStr && todayStr <= e.endDate) return true;
      return false;
    });
  }, [events, todayStr]);

  useEffect(() => {
    if (isShortcut) {
      setSelectedDate(todayStr);
      const timer = setTimeout(() => {
        document.getElementById("calendar-today-cell")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isShortcut, todayStr]);

  // Month navigation
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayStr);
  };

  // Month view days calculation
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is index 0 in TR (Sunday is 0 in JS Date)
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex < 0) startDayIndex = 6;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month, todayStr]);

  // Week view days calculation
  const weekDays = useMemo(() => {
    const base = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0, 0);
    const dayOfWeek = base.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffToMonday, 12, 0, 0);

    const days: {
      dateStr: string;
      dayName: string;
      fullDayName: string;
      dayNumber: number;
      monthName: string;
      month: number;
      year: number;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
      const m = dayDate.getMonth();
      const y = dayDate.getFullYear();
      const d = dayDate.getDate();
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      days.push({
        dateStr,
        dayName: DAY_NAMES[i],
        fullDayName: FULL_DAY_NAMES[i],
        dayNumber: d,
        monthName: MONTH_NAMES[m],
        month: m,
        year: y,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentDate, todayStr]);

  // Events for a specific date
  const getEventsForDay = (dateStr: string) => {
    return filteredEvents.filter((e) => {
      if (e.date === dateStr) return true;
      if (e.endDate && e.date <= dateStr && dateStr <= e.endDate) return true;
      return false;
    });
  };

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return getEventsForDay(selectedDate);
  }, [selectedDate, filteredEvents]);

  const handleOpenCreate = (dateToUse?: string) => {
    setEditingEvent(null);
    setModalDate(dateToUse || selectedDate || todayStr);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: CalendarEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingEvent(evt);
    setModalDate(evt.date);
    setIsModalOpen(true);
  };

  const headerTitle = useMemo(() => {
    if (viewMode === "month") {
      return `${MONTH_NAMES[month]} ${year}`;
    }
    if (weekDays.length > 0) {
      const first = weekDays[0];
      const last = weekDays[6];
      if (first.month !== last.month) {
        if (first.year !== last.year) {
          return `${first.monthName} ${first.year} - ${last.monthName} ${last.year}`;
        }
        return `${first.monthName} - ${last.monthName} ${last.year}`;
      }
      return `${first.monthName} ${first.year}`;
    }
    return `${MONTH_NAMES[month]} ${year}`;
  }, [viewMode, month, year, weekDays]);

  return (
    <div className="space-y-6">
      {/* Today's Events Hero Banner */}
      <TodayEventBanner
        todayEvents={todayEvents}
        todayStr={todayStr}
        onAddNew={(dateStr) => handleOpenCreate(dateStr)}
        onEditEvent={(evt) => handleOpenEdit(evt)}
        onScrollToCalendar={() => {
          document.getElementById("calendar-main-view")?.scrollIntoView({ behavior: "smooth" });
        }}
        isShortcutOpen={isShortcut}
      />

      {/* Top Header Controls */}
      <div
        id="calendar-main-view"
        className="ds-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 sm:p-5"
      >
        {/* Date & Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-raised p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-surface transition cursor-pointer"
              title="Önceki"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 h-8 flex items-center justify-center rounded-lg text-xs font-semibold text-foreground hover:bg-surface transition cursor-pointer"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-surface transition cursor-pointer"
              title="Sonraki"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {headerTitle}
          </h2>
        </div>

        {/* Right Controls: Filters, View Toggle & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center rounded-xl border border-border bg-surface-raised p-1">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "month"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "week"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Haftalık
            </button>
          </div>

          {/* Notification Settings & Test */}
          <NotificationBellButton />

          {/* AI Voice & Text Event Assistant */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="accent-button h-9 px-3.5 text-xs"
            title="Sesli veya Yazılı Yapay Zeka ile Ekle"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>Yapay Zeka ile Ekle</span>
          </button>

          {/* New Event Button */}
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="primary-button h-9 px-3.5 text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Etkinlik Ekle</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (Scope & Person) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-muted font-semibold mr-1 shrink-0">Filtrele:</span>
        <button
          type="button"
          onClick={() => setFilterProfileId("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border ${
            filterProfileId === "all"
              ? "bg-primary border-primary text-primary-foreground shadow-xs"
              : "bg-surface border-border text-foreground-secondary hover:text-foreground hover:bg-surface-raised"
          }`}
        >
          Tümü ({events.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterProfileId("common")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border ${
            filterProfileId === "common"
              ? "bg-primary border-primary text-primary-foreground shadow-xs"
              : "bg-surface border-border text-foreground-secondary hover:text-foreground hover:bg-surface-raised"
          }`}
        >
          Ortak Hane ({events.filter((e) => e.scope === "common").length})
        </button>

        {profiles.map((p) => {
          const count = events.filter(
            (e) =>
              e.scope === "personal" &&
              (e.targetProfileId === p.id || e.createdByProfileId === p.id)
          ).length;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilterProfileId(p.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border ${
                filterProfileId === p.id
                  ? "bg-primary border-primary text-primary-foreground shadow-xs"
                  : "bg-surface border-border text-foreground-secondary hover:text-foreground hover:bg-surface-raised"
              }`}
            >
              <UserIcon className="h-3 w-3" />
              <span>{p.firstName}</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* MAIN VIEW AREA: MONTH OR WEEK */}
      {viewMode === "month" ? (
        /* ================= MONTH VIEW ================= */
        <div className="ds-card overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-border bg-surface-raised text-center">
            {DAY_NAMES.map((name, idx) => (
              <div
                key={name}
                className={`py-2.5 text-xs font-bold uppercase tracking-wider ${
                  idx >= 5 ? "text-primary" : "text-muted"
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border">
            {monthDays.map((day) => {
              const dayEvents = getEventsForDay(day.dateStr);
              const isSelected = day.dateStr === selectedDate;

              return (
                <div
                  key={day.dateStr}
                  id={day.isToday ? "calendar-today-cell" : undefined}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`min-h-[82px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col transition-colors cursor-pointer group ${
                    !day.isCurrentMonth
                      ? "bg-surface-raised/50 opacity-45 hover:opacity-80"
                      : "bg-surface hover:bg-surface-raised/60"
                  } ${isSelected ? "ring-2 ring-inset ring-primary bg-surface-lavender/50" : ""}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                        day.isToday
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : isSelected
                          ? "text-primary font-extrabold"
                          : "text-foreground"
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Quick Add icon on hover or when selected */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(day.dateStr);
                      }}
                      className={`${
                        isSelected
                          ? "opacity-100"
                          : "opacity-0 sm:group-hover:opacity-100"
                      } h-5 w-5 rounded-md bg-surface-raised border border-border text-[11px] font-bold text-muted hover:text-primary hover:border-border-lavender transition flex items-center justify-center cursor-pointer`}
                      title="Bu güne etkinlik ekle"
                    >
                      +
                    </button>
                  </div>

                  {/* Events Badges in Day Cell */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const cat = CALENDAR_CATEGORIES[evt.category] || CALENDAR_CATEGORIES.default;
                      const isCommon = evt.scope === "common";

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => handleOpenEdit(evt, e)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold truncate border transition cursor-pointer ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                          title={`${evt.title} (${isCommon ? "Ortak" : evt.targetProfileName || evt.createdByName})`}
                        >
                          <span className="shrink-0">{cat.icon}</span>
                          <span className="truncate flex-1">{evt.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <span className="text-[10px] font-semibold text-muted block pl-1">
                        +{dayEvents.length - 3} daha
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= WEEK VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day.dateStr);
            const isSelected = day.dateStr === selectedDate;

            return (
              <div
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all cursor-pointer ${
                  day.isToday
                    ? "border-primary bg-surface-lavender/50 ring-1 ring-primary/20"
                    : isSelected
                    ? "border-primary bg-surface shadow-sm"
                    : "border-border bg-surface hover:border-border-lavender"
                }`}
              >
                <div>
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                        {day.dayName}
                      </span>
                      <span className="text-base font-bold text-foreground">
                        {day.dayNumber} {day.monthName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(day.dateStr);
                      }}
                      className="h-7 w-7 rounded-lg bg-surface-raised border border-border text-xs font-bold text-muted hover:text-primary hover:border-border-lavender transition flex items-center justify-center cursor-pointer"
                      title="Etkinlik Ekle"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Day Events List */}
                  <div className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <span className="text-xs text-muted block py-3 text-center">
                        Plan yok
                      </span>
                    ) : (
                      dayEvents.map((evt) => {
                        const cat = CALENDAR_CATEGORIES[evt.category] || CALENDAR_CATEGORIES.default;
                        const isCommon = evt.scope === "common";

                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => handleOpenEdit(evt, e)}
                            className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer space-y-1 ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate flex-1">
                                {cat.icon} {evt.title}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface/90 text-foreground">
                                {isCommon ? "Ortak" : evt.targetProfileName || "Kişisel"}
                              </span>
                            </div>

                            {!evt.isAllDay && evt.time && (
                              <div className="text-[10px] opacity-85 font-semibold">
                                {evt.time} {evt.endTime ? `- ${evt.endTime}` : ""}
                              </div>
                            )}

                            {evt.description && (
                              <p className="text-[11px] opacity-85 line-clamp-2 leading-snug">
                                {evt.description}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCreate(day.dateStr);
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-primary hover:bg-surface-lavender rounded-lg transition cursor-pointer"
                  >
                    + Etkinlik Ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SELECTED DATE DETAILS & UPCOMING EVENTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Selected Date Detail Card */}
        <div className="lg:col-span-2 ds-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Seçili Günün Planları
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 mt-0.5">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span>{selectedDate}</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreate(selectedDate)}
              className="primary-button h-9 px-3.5 text-xs"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Bu Güne Ekle</span>
            </button>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-border-lavender bg-surface-lavender text-primary">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <p className="text-xs sm:text-sm text-muted">
                Bu tarih için henüz bir etkinlik veya plan bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDateEvents.map((evt) => {
                const cat = CALENDAR_CATEGORIES[evt.category] || CALENDAR_CATEGORIES.default;
                const isCommon = evt.scope === "common";

                return (
                  <div
                    key={evt.id}
                    onClick={() => handleOpenEdit(evt)}
                    className={`p-4 rounded-xl border transition-all hover:shadow-sm cursor-pointer space-y-2 ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm truncate flex-1">
                        {cat.icon} {evt.title}
                      </h4>
                      <span className="rounded-md bg-surface/90 text-foreground px-2 py-0.5 text-[10px] font-semibold">
                        {isCommon ? "Ortak" : evt.targetProfileName || "Kişisel"}
                      </span>
                    </div>

                    {!evt.isAllDay && evt.time && (
                      <span className="text-xs font-semibold flex items-center gap-1 opacity-90">
                        <ClockIcon className="h-3 w-3" />
                        {evt.time} {evt.endTime ? `- ${evt.endTime}` : ""}
                      </span>
                    )}

                    {evt.description && (
                      <p className="text-xs opacity-85 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-current/15 flex items-center justify-between text-[11px] opacity-80">
                      <span>Ekleyen: {evt.createdByName}</span>
                      <span className="font-semibold underline">Düzenle →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Info & Stats Widget */}
        <div className="ds-card p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span>Takvim İpuçları</span>
          </h3>
          <ul className="text-xs text-foreground-secondary space-y-3 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span><strong>Ortak Etkinlik:</strong> Tüm hane halkı ortak etkinlikleri görür ve takip eder.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span><strong>Kişisel Etkinlik:</strong> Belirli bir kişiye atanır ancak diğer hane üyeleri de takvimde görebilir.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>Haftalık görünüme geçerek haftanın günlerini detaylı inceleyebilirsiniz.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Calendar Event Modal */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={modalDate}
        initialEvent={editingEvent}
        onSaved={loadEvents}
      />

      {/* AI Voice & Text Event Modal */}
      <CalendarAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onEventsAdded={loadEvents}
      />
    </div>
  );
}
