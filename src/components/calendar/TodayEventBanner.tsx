"use client";

import React from "react";
import { CalendarEvent, CALENDAR_CATEGORIES } from "@/domain/calendarTypes";
import { CalendarIcon, PlusIcon, ArrowRightIcon, ClockIcon } from "@/components/ui/Icons";

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
    <section className="ds-card-lavender p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-lavender bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <CalendarIcon className="h-3.5 w-3.5" />
              Günün Etkinlikleri
            </span>
            {isShortcutOpen && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border-lavender bg-surface px-2 py-0.5 text-[11px] font-semibold text-primary">
                Kısayol
              </span>
            )}
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-surface text-foreground border border-border">
              {todayEvents.length} Plan
            </span>
          </div>

          <span className="text-xs font-semibold text-foreground-secondary flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            {todayFormatted}
          </span>
        </div>

        {/* Content Area */}
        {hasEvents ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {todayEvents.map((evt) => {
                const cat = CALENDAR_CATEGORIES[evt.category] || CALENDAR_CATEGORIES.default;

                return (
                  <div
                    key={evt.id}
                    onClick={() => onEditEvent(evt)}
                    className="group flex flex-col justify-between p-4 rounded-xl border border-border bg-surface hover:border-border-lavender hover:shadow-sm transition-all duration-150 cursor-pointer text-left"
                  >
                    <div>
                      {/* Category & Time Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface-raised px-2 py-0.5 rounded-md border border-border">
                          <ClockIcon className="h-3 w-3" />
                          {evt.isAllDay ? "Tüm Gün" : evt.time || "Saat belirtilmedi"}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
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
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border text-[11px]">
                      <span className="text-muted truncate">
                        {evt.scope === "common" ? (
                          <span className="text-primary font-semibold">Ortak Hane</span>
                        ) : (
                          <span className="text-foreground-secondary font-medium">
                            {evt.targetProfileName || evt.createdByName || "Kişisel"}
                          </span>
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold group-hover:underline">
                        <span>Düzenle</span>
                        <ArrowRightIcon className="h-3 w-3" />
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
                className="primary-button h-9 px-3.5 text-xs"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                <span>Bugün İçin Plan Ekle</span>
              </button>

              {onScrollToCalendar && (
                <button
                  type="button"
                  onClick={onScrollToCalendar}
                  className="secondary-button h-9 px-3.5 text-xs"
                >
                  <span>Aylık Takvimde Gör</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty Today State */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Bugün için planlanmış bir etkinlik bulunmuyor
              </h3>
              <p className="text-xs sm:text-sm text-foreground-secondary">
                Bugün için randevu, doktor kontrolü, nöbet veya ortak aile planı ekleyebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onAddNew(todayStr)}
                className="primary-button h-10 px-4 text-xs sm:text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Etkinlik Planla</span>
              </button>

              {onScrollToCalendar && (
                <button
                  type="button"
                  onClick={onScrollToCalendar}
                  className="secondary-button h-10 px-3.5 text-xs"
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
