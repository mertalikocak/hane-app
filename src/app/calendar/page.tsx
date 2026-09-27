import { Metadata } from "next";
import { CalendarView } from "@/components/calendar/CalendarView";

export const metadata: Metadata = {
  title: "Hane Calendar - Aile & Kişisel Ortak Takvim",
  description: "Hane halkı ortak ve bireysel etkinlikleri, randevuları ve planları takvim üzerinden yönetin.",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 text-2xl shadow-md text-white">
            📅
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Hane Calendar
              </h1>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Takvim
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted">
              Ortak aile planları, randevular ve kişisel etkinlikler
            </p>
          </div>
        </div>
      </div>

      {/* Main Calendar Component */}
      <CalendarView />
    </div>
  );
}
