"use client";

import React from "react";
import { CalendarEvent, CALENDAR_CATEGORIES } from "@/domain/calendarTypes";

interface TodayEventBannerProps {
  todayEvents: CalendarEvent[];
  todayStr: string;
  onAddNew: (dateStr: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onScrollToCalendar?: () => void;
  isShortcutOpen?: boolean;
}

export function TodayEventBanner({
  todayEvents,
  todayStr,
  onAddNew,
  onEditEvent,
  onScrollToCalendar,
  isShortcutOpen,
}: TodayEventBannerProps) {
  const todayFormatted = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const hasEvents = todayEvents.length > 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-pink-500/5 p-5 sm:p-7 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Decorative ambient light */}
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-400">
              <span className="text-sm">📅</span> GÜNÜN ETKİNLİKLERİ
            </span>
            {isShortcutOpen && (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 animate-pulse">
                ⚡ Kısayol
              </span>
            )}
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface/70 text-foreground/80 border border-border/60">
              {todayEvents.length} Plan
            </span>
          </div>

          <span className="text-xs font-medium text-muted flex items-center gap-1">
            <span>🗓️</span> {todayFormatted}
          </span>
        </div>

        {/* Content Area */}
        {hasEvents ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayEvents.map((evt) => {
                const cat = CALENDAR_CATEGORIES[evt.category] || CALENDAR_CATEGORIES.default;

                return (
                  <div
                    key={evt.id}
                    onClick={() => onEditEvent(evt)}
                    className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-border/80 bg-surface/80 hover:bg-surface hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
                  >
                    <div>
                      {/* Category & Time Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold border ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>

                        <span className="text-[11px] font-semibold text-muted bg-surface-raised px-2 py-0.5 rounded-md border border-border/60">
                          {evt.isAllDay ? "Tüm Gün" : evt.time || "Saat belirtilmedi"}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {evt.title}
                      </h4>

                      {/* Description if any */}
                      {evt.description && (
                        <p className="text-xs text-muted line-clamp-1 mt-1">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    {/* Footer: Scope & Profile Info */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/50 text-[11px]">
                      <span className="text-muted truncate">
                        {evt.scope === "common" ? (
                          <span className="text-amber-500 font-semibold">🏠 Tüm Hane</span>
                        ) : (
                          <span className="text-foreground/80 font-medium">
                            👤 {evt.targetProfileName || evt.createdByName || "Kişisel"}
                          </span>
                        )}
                      </span>

                      <span className="text-[10px] text-indigo-400 font-semibold group-hover:underline">
                        Detay →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onAddNew(todayStr)}
                className="primary-button text-xs font-bold py-2 px-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md cursor-pointer"
              >
                <span>+ Bugün İçin Yeni Plan Ekle</span>
              </button>

              {onScrollToCalendar && (
                <button
                  type="button"
                  onClick={onScrollToCalendar}
                  className="secondary-button text-xs font-semibold py-2 px-3 cursor-pointer"
                >
                  <span>Aylık Takvimde Gör</span>
                  <span>↓</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty Today State */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Bugün için planlanmış bir etkinlik bulunmuyor
              </h3>
              <p className="text-xs sm:text-sm text-muted">
                Bugün için randevu, doktor kontrolü, nöbet veya ortak aile planı ekleyebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onAddNew(todayStr)}
                className="primary-button text-xs sm:text-sm py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md font-bold cursor-pointer"
              >
                <span>+ Etkinlik Planla</span>
              </button>

              {onScrollToCalendar && (
                <button
                  type="button"
                  onClick={onScrollToCalendar}
                  className="secondary-button text-xs py-2 px-3 cursor-pointer"
                >
                  Takvimi İncele
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
