import { Suspense } from "react";
import { Metadata } from "next";
import { CalendarView } from "@/components/calendar/CalendarView";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Hane Calendar - Aile & Kişisel Ortak Takvim",
  description: "Hane halkı ortak ve bireysel etkinlikleri, randevuları ve planları takvim üzerinden yönetin.",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        badge="Hane Takvim"
        icon={<CalendarIcon className="h-3.5 w-3.5" />}
        title="Ortak Aile & Kişisel Takvim"
        subtitle="Ortak aile planları, randevular, nöbetler ve kişisel etkinlikleri tek takvimde yönetin."
      />

      {/* Main Calendar Component */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-raised border border-border" />}>
        <CalendarView />
      </Suspense>
    </div>
  );
}
