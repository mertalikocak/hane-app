"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileService } from "@/services/profileService";
import { MeasurementService } from "@/services/measurementService";
import {
  getFullMeasurementRecords,
  getProfileStats,
} from "@/storage/bodyStorage";
import {
  Profile,
  FullMeasurementRecord,
  ProfileStats,
} from "@/domain/bodyTrackingTypes";
import {
  calculateBMI,
  getBMICategory,
  getBodyFatCategory,
} from "@/domain/bodyCalculations";
import {
  calculateChangeFromPrevious,
  calculateChangeFromStart,
  MetricChangeResult,
} from "@/domain/measurementChangeCalculations";
import { MeasurementModal } from "@/components/fit/MeasurementModal";
import { ProgressCharts } from "@/components/fit/ProgressCharts";

function MetricChangeRow({
  label,
  change,
}: {
  label: string;
  change: MetricChangeResult | null;
}) {
  if (!change) return null;
  return (
    <div className="flex items-center justify-between gap-1 text-[11px]">
      <span className="text-muted">{label}</span>
      <span
        className={`font-bold inline-flex items-center gap-0.5 ${
          change.direction === "decrease"
            ? "text-emerald-500"
            : change.direction === "increase"
            ? "text-amber-500"
            : "text-muted"
        }`}
      >
        {change.formattedDiff}
      </span>
    </div>
  );
}

function formatTurkishDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export default function ProfileDashboardPage() {
  const router = useRouter();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<FullMeasurementRecord[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ totalMeasurements: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal and Interactive States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FullMeasurementRecord | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<FullMeasurementRecord | null>(null);

  const loadDashboardData = () => {
    const profile = ProfileService.getActive();
    if (!profile) {
      const all = ProfileService.getAll();
      if (all.length > 0) {
        ProfileService.setActive(all[0].id);
        setActiveProfile(all[0]);
        const recs = getFullMeasurementRecords(all[0].id);
        // Sort chronologically descending (newest first)
        recs.sort((a, b) => new Date(b.measurement.date).getTime() - new Date(a.measurement.date).getTime());
        setRecords(recs);
        setStats(getProfileStats(all[0].id));
      } else {
        router.push("/fit");
      }
    } else {
      setActiveProfile(profile);
      const recs = getFullMeasurementRecords(profile.id);
      // Sort chronologically descending (newest first)
      recs.sort((a, b) => new Date(b.measurement.date).getTime() - new Date(a.measurement.date).getTime());
      setRecords(recs);
      setStats(getProfileStats(profile.id));
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadDashboardData();

    const handleUpdate = () => loadDashboardData();
    window.addEventListener("fit_profile_changed", handleUpdate);
    window.addEventListener("fit_measurements_updated", handleUpdate);
    window.addEventListener("fit_profiles_updated", handleUpdate);
    return () => {
      window.removeEventListener("fit_profile_changed", handleUpdate);
      window.removeEventListener("fit_measurements_updated", handleUpdate);
      window.removeEventListener("fit_profiles_updated", handleUpdate);
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: FullMeasurementRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  const handlePromptDelete = (rec: FullMeasurementRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingRecord(rec);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    MeasurementService.delete(deletingRecord.measurement.id);
    if (expandedRecordId === deletingRecord.measurement.id) {
      setExpandedRecordId(null);
    }
    setDeletingRecord(null);
    loadDashboardData();
  };

  const toggleExpand = (recordId: string) => {
    setExpandedRecordId((prev) => (prev === recordId ? null : recordId));
  };

  if (!isLoaded || !activeProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const latestRecord = records[0];

  // Two-level change calculations using dedicated pure domain utilities
  const weightPrevChange = calculateChangeFromPrevious(
    records,
    (r) => r.measurement.weight,
    "kg"
  );
  const weightStartChange = calculateChangeFromStart(
    records,
    (r) => r.measurement.weight,
    "kg"
  );

  const bodyFatPrevChange = calculateChangeFromPrevious(
    records,
    (r) => r.measurement.bodyFat,
    "%"
  );
  const bodyFatStartChange = calculateChangeFromStart(
    records,
    (r) => r.measurement.bodyFat,
    "%"
  );

  const waistPrevChange = calculateChangeFromPrevious(
    records,
    (r) => r.measurement.waist,
    "cm"
  );
  const waistStartChange = calculateChangeFromStart(
    records,
    (r) => r.measurement.waist,
    "cm"
  );

  const bmiInfo = stats.latestBMI ? getBMICategory(stats.latestBMI) : null;
  const bodyFatInfo =
    latestRecord?.measurement.bodyFat !== undefined && latestRecord?.measurement.bodyFat !== null
      ? getBodyFatCategory(activeProfile.gender, latestRecord.measurement.bodyFat)
      : null;

  const initials =
    `${activeProfile.firstName[0] || ""}${
      activeProfile.lastName ? activeProfile.lastName[0] : ""
    }`.toUpperCase() || "👤";

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. TOP PROFILE HEADER SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface via-surface to-surface-raised/80 p-6 sm:p-8 shadow-xs">
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar & Profile Bio */}
          <div className="flex items-center gap-5">
            {/* Big Gradient Avatar */}
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 text-white font-black text-2xl sm:text-3xl shadow-md ring-4 ring-emerald-500/20">
              {initials}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-surface border border-border text-sm shadow-xs">
                {activeProfile.gender === "male" ? "👨" : "👩"}
              </span>
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {activeProfile.firstName} {activeProfile.lastName}
                </h1>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Aktif Profil
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted font-medium">
                <span className="flex items-center gap-1">
                  <span>📏 Boy:</span>
                  <strong className="text-foreground">{activeProfile.height} cm</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>Cinsiyet:</span>
                  <strong className="text-foreground">
                    {activeProfile.gender === "male" ? "Erkek" : "Kadın"}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>Toplam Ölçüm:</span>
                  <strong className="text-foreground">{records.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Switch Profile & Header Actions */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            <Link
              href="/fit"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-raised hover:border-emerald-500/40 transition shadow-xs cursor-pointer"
            >
              <span>👥</span>
              <span>Profil Değiştir</span>
            </Link>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:scale-98 transition cursor-pointer"
            >
              <span>+</span>
              <span>Ölçüm Ekle</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN SECTION: SON ÖLÇÜM ÖZETİ OR EMPTY STATE */}
      {records.length === 0 ? (
        /* Empty State */
        <section className="rounded-3xl border border-dashed border-border/90 bg-surface p-8 sm:p-14 text-center space-y-5 shadow-xs">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-4xl shadow-inner">
            ⚖️
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Henüz ölçüm eklenmedi
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Kilonuzu, bel ve boyun ölçülerinizi kaydederek vücut yağ oranı ve gelişim grafiğinizi oluşturmaya hemen başlayın.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 text-sm sm:base font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl active:scale-98 transition cursor-pointer"
            >
              <span>+</span>
              <span>İlk Ölçümünü Ekle</span>
            </button>
          </div>
        </section>
      ) : (
        /* Active Measurement Summary Dashboard */
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                Son Ölçüm Özeti
              </h2>
              <p className="text-xs text-muted">
                Kişisel vücut kompozisyonunuzun güncel durumu ve gelişim farkları
              </p>
            </div>

            <div className="text-xs font-semibold text-muted bg-surface-raised px-3 py-1.5 rounded-xl border border-border/60">
              📅 {formatTurkishDate(latestRecord.measurement.date)}
            </div>
          </div>

          {/* 4 Big Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Kilo */}
            <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Kilo
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-lg">
                  ⚖️
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-foreground">
                    {latestRecord.measurement.weight}
                  </span>
                  <span className="text-base font-bold text-muted">kg</span>
                </div>

                {/* Two-level change section */}
                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                  {records.length <= 1 ? (
                    <span className="text-[11px] text-muted block">İlk kayıt</span>
                  ) : (
                    <>
                      <MetricChangeRow
                        label="Önceki ölçüme göre"
                        change={weightPrevChange}
                      />
                      <MetricChangeRow
                        label="Başlangıçtan itibaren"
                        change={weightStartChange}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Yağ Oranı */}
            <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs flex flex-col justify-between hover:border-teal-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Yağ Oranı
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 text-lg">
                  🎯
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-foreground">
                    {latestRecord.measurement.bodyFat !== undefined && latestRecord.measurement.bodyFat !== null
                      ? `${latestRecord.measurement.bodyFat}%`
                      : "—"}
                  </span>
                  {bodyFatInfo && (
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-bold bg-surface-raised border border-border/60 ${bodyFatInfo.color}`}
                    >
                      {bodyFatInfo.label}
                    </span>
                  )}
                </div>

                {/* Two-level change section */}
                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                  {latestRecord.measurement.bodyFat === undefined ||
                  latestRecord.measurement.bodyFat === null ? (
                    <span className="text-[11px] text-muted block">
                      Bel ve boyun ölçümü ile hesaplanır
                    </span>
                  ) : records.length <= 1 ? (
                    <span className="text-[11px] text-muted block">İlk kayıt</span>
                  ) : (
                    <>
                      {bodyFatPrevChange && (
                        <MetricChangeRow
                          label="Önceki ölçüme göre"
                          change={bodyFatPrevChange}
                        />
                      )}
                      {bodyFatStartChange && (
                        <MetricChangeRow
                          label="Başlangıçtan itibaren"
                          change={bodyFatStartChange}
                        />
                      )}
                      {!bodyFatPrevChange && !bodyFatStartChange && (
                        <span className="text-[11px] text-muted block">
                          Önceki yağ oranı kaydı yok
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Bel Ölçüsü */}
            <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs flex flex-col justify-between hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Bel Çevresi
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-lg">
                  📐
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-foreground">
                    {latestRecord.measurement.waist ? latestRecord.measurement.waist : "—"}
                  </span>
                  {latestRecord.measurement.waist ? (
                    <span className="text-base font-bold text-muted">cm</span>
                  ) : null}
                </div>

                {/* Two-level change section */}
                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                  {!latestRecord.measurement.waist ? (
                    <span className="text-[11px] text-muted block">
                      {latestRecord.measurement.neck
                        ? `Boyun: ${latestRecord.measurement.neck} cm`
                        : "Bel ölçümü girilmedi"}
                    </span>
                  ) : records.length <= 1 ? (
                    <span className="text-[11px] text-muted block">İlk kayıt</span>
                  ) : (
                    <>
                      {waistPrevChange && (
                        <MetricChangeRow
                          label="Önceki ölçüme göre"
                          change={waistPrevChange}
                        />
                      )}
                      {waistStartChange && (
                        <MetricChangeRow
                          label="Başlangıçtan itibaren"
                          change={waistStartChange}
                        />
                      )}
                      {!waistPrevChange && !waistStartChange && (
                        <span className="text-[11px] text-muted block">
                          Önceki bel kaydı yok
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Son Ölçüm Tarihi */}
            <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs flex flex-col justify-between hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Son Ölçüm
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-lg">
                  📅
                </span>
              </div>

              <div className="mt-4">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground block leading-tight">
                  {formatTurkishDate(latestRecord.measurement.date)}
                </span>

                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1 text-xs">
                  {bmiInfo && stats.latestBMI ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">BMI</span>
                      <span className="font-bold text-foreground">
                        {stats.latestBMI} <span className={`font-semibold ${bmiInfo.color}`}>({bmiInfo.label})</span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted">Boy: {activeProfile.height} cm</div>
                  )}
                  {latestRecord.measurement.neck ? (
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>Boyun</span>
                      <span className="font-semibold text-foreground">{latestRecord.measurement.neck} cm</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. PROGRESS & EVOLUTION CHARTS SECTION (GELİŞİM GRAFİKLERİ) */}
      <ProgressCharts records={records} gender={activeProfile.gender} />

      {/* 4. PROMINENT CALL TO ACTION BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative z-10 space-y-1 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold backdrop-blur-md">
            ⚡ HIZLI TAKİP
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Yeni bir ölçüm kaydetmek ister misiniz?
          </h3>
          <p className="text-xs sm:text-sm text-white/80">
            Düzenli haftalık ölçümler form grafiğinizin doğruluğunu artırır.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="relative z-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-emerald-800 shadow-md hover:bg-white/95 active:scale-98 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span>Ölçüm Ekle</span>
        </button>

        {/* Decorative blur */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/10 blur-3xl rounded-full pointer-events-none" />
      </section>

      {/* 4. GEÇMİŞ ÖLÇÜMLER SECTION (CHRONOLOGICAL CARDS WITH EXPANDABLE DETAILS, EDIT & DELETE) */}
      <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/70">
          <div>
            <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>📊</span>
              <span>Geçmiş Ölçümler</span>
            </h3>
            <p className="text-xs text-muted">
              Tarih sırasına göre kaydedilmiş tüm ölçüm detayları ve kas gelişim raporları
            </p>
          </div>

          <span className="text-xs font-bold text-muted bg-surface-raised px-3 py-1.5 rounded-xl border border-border/60 self-start sm:self-auto">
            Toplam: <strong className="text-foreground">{records.length} Kayıt</strong>
          </span>
        </div>

        {records.length === 0 ? (
          /* Empty state for past measurements */
          <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-surface-raised/40 space-y-3">
            <span className="text-3xl block">📋</span>
            <p className="text-sm font-bold text-foreground">
              Henüz geçmiş ölçüm kaydı bulunmuyor
            </p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Ölçüm ekledikçe burada tarihsel kilo, yağ oranı, bel, boyun ve kas ölçümlerinizin detaylı dökümü yer alacaktır.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
            >
              <span>+</span>
              <span>İlk Ölçümünü Ekle</span>
            </button>
          </div>
        ) : (
          /* Historical Records Timeline Cards */
          <div className="space-y-4">
            {records.map((rec, idx) => {
              const m = rec.measurement;
              const mus = rec.muscle;
              const isExpanded = expandedRecordId === m.id;

              // Check if muscle measurements were recorded
              const hasMuscleData =
                !!mus &&
                (mus.shoulder !== undefined ||
                  mus.chest !== undefined ||
                  mus.back !== undefined ||
                  mus.rightArm !== undefined ||
                  mus.leftArm !== undefined ||
                  mus.rightThigh !== undefined ||
                  mus.leftThigh !== undefined ||
                  mus.rightCalf !== undefined ||
                  mus.leftCalf !== undefined);

              // Calculate BMI for this individual record
              const recordBMI = calculateBMI(m.weight, activeProfile.height);
              const recordBMICat = recordBMI ? getBMICategory(recordBMI) : null;
              const recordBodyFatCat =
                m.bodyFat !== undefined && m.bodyFat !== null
                  ? getBodyFatCategory(activeProfile.gender, m.bodyFat)
                  : null;

              return (
                <div
                  key={m.id}
                  className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "border-emerald-500/50 bg-surface shadow-md ring-1 ring-emerald-500/20"
                      : "border-border/80 bg-surface-raised/40 hover:bg-surface-raised/80 hover:border-emerald-500/30"
                  }`}
                >
                  {/* Card Main Clickable Header */}
                  <div
                    onClick={() => toggleExpand(m.id)}
                    className="p-5 sm:p-6 cursor-pointer select-none space-y-4"
                  >
                    {/* Top Row: Index Badge, Date, Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                          #{records.length - idx}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-foreground">
                              {formatTurkishDate(m.date)}
                            </span>
                            {idx === 0 && (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                Son Kayıt
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted">
                            {m.date}
                          </span>
                        </div>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(rec, e)}
                          className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-surface px-3 py-1.5 text-xs font-bold text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer shadow-xs"
                          title="Ölçümü Düzenle"
                        >
                          <span>✏️</span>
                          <span>Düzenle</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handlePromptDelete(rec, e)}
                          className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-surface px-3 py-1.5 text-xs font-bold text-muted hover:text-rose-600 hover:border-rose-400/50 hover:bg-rose-500/10 transition cursor-pointer shadow-xs"
                          title="Ölçümü Sil"
                        >
                          <span>🗑️</span>
                          <span>Sil</span>
                        </button>

                        {/* Chevron Indicator */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(m.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface border border-border/60 text-muted hover:text-foreground transition ml-1 cursor-pointer"
                          aria-label="Detayı Göster/Gizle"
                        >
                          <span
                            className={`text-xs font-bold transition-transform duration-200 inline-block ${
                              isExpanded ? "rotate-180" : "rotate-0"
                            }`}
                          >
                            ▼
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Key Metrics Grid (Tarih, Kilo, Yağ Oranı, Bel, Boyun, Kalça) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-3 border-t border-border/60">
                      {/* 1. Kilo */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Kilo
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black text-foreground">
                            {m.weight}
                          </span>
                          <span className="text-xs font-medium text-muted">kg</span>
                        </div>
                      </div>

                      {/* 2. Yağ Oranı (null ise '—') */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Yağ Oranı
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {m.bodyFat !== undefined && m.bodyFat !== null
                              ? `${m.bodyFat}%`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* 3. Bel */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Bel
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black text-foreground">
                            {m.waist ? m.waist : "—"}
                          </span>
                          {m.waist ? (
                            <span className="text-xs font-medium text-muted">cm</span>
                          ) : null}
                        </div>
                      </div>

                      {/* 4. Boyun */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Boyun
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black text-foreground">
                            {m.neck ? m.neck : "—"}
                          </span>
                          {m.neck ? (
                            <span className="text-xs font-medium text-muted">cm</span>
                          ) : null}
                        </div>
                      </div>

                      {/* 5. Kadınsa Kalça */}
                      {activeProfile.gender === "female" && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                            Kalça
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-black text-foreground">
                              {m.hip ? m.hip : "—"}
                            </span>
                            {m.hip ? (
                              <span className="text-xs font-medium text-muted">cm</span>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Measurement Detail Drawer */}
                  {isExpanded && (
                    <div className="border-t border-border/80 bg-surface p-5 sm:p-7 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Detailed Vücut ve Kompozisyon Özeti */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                          <span>📐</span>
                          <span>Vücut ve Kompozisyon Detayları</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Kilo & BMI */}
                          <div className="rounded-2xl border border-border/70 bg-surface-raised p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted block">
                              Ağırlık / BMI
                            </span>
                            <div className="text-sm font-black text-foreground">
                              {m.weight} kg
                            </div>
                            {recordBMI && recordBMICat && (
                              <span className={`text-[10px] font-bold block ${recordBMICat.color}`}>
                                BMI {recordBMI} ({recordBMICat.label})
                              </span>
                            )}
                          </div>

                          {/* Yağ Oranı */}
                          <div className="rounded-2xl border border-border/70 bg-surface-raised p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted block">
                              Vücut Yağ Oranı
                            </span>
                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {m.bodyFat !== undefined && m.bodyFat !== null
                                ? `${m.bodyFat}%`
                                : "—"}
                            </div>
                            {recordBodyFatCat ? (
                              <span className={`text-[10px] font-bold block ${recordBodyFatCat.color}`}>
                                {recordBodyFatCat.label}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted block">
                                Bel & boyun gerekli
                              </span>
                            )}
                          </div>

                          {/* Bel & Boyun */}
                          <div className="rounded-2xl border border-border/70 bg-surface-raised p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted block">
                              Bel & Boyun Çevresi
                            </span>
                            <div className="text-xs font-bold text-foreground">
                              Bel: {m.waist ? `${m.waist} cm` : "—"}
                            </div>
                            <div className="text-xs font-medium text-muted">
                              Boyun: {m.neck ? `${m.neck} cm` : "—"}
                            </div>
                          </div>

                          {/* Kalça / Profil Boyu */}
                          <div className="rounded-2xl border border-border/70 bg-surface-raised p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted block">
                              {activeProfile.gender === "female" ? "Kalça & Boy" : "Profil Boyu"}
                            </span>
                            {activeProfile.gender === "female" && (
                              <div className="text-xs font-bold text-foreground">
                                Kalça: {m.hip ? `${m.hip} cm` : "—"}
                              </div>
                            )}
                            <div className="text-xs font-medium text-muted">
                              Boy: {activeProfile.height} cm
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kas Ölçümleri Bölümü */}
                      <div className="pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                            <span>💪</span>
                            <span>Bölgesel Kas Ölçümleri</span>
                          </h4>

                          {hasMuscleData && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              9 Bölge Takibi
                            </span>
                          )}
                        </div>

                        {!hasMuscleData ? (
                          /* Açıkça belirtilen kas ölçümü girilmemiş durumu */
                          <div className="rounded-2xl border border-dashed border-border/80 bg-surface-raised/50 p-4 text-center space-y-1">
                            <p className="text-xs font-semibold text-muted">
                              ⚠️ Bu kayıt için kas ölçümü girilmemiştir.
                            </p>
                            <p className="text-[11px] text-muted/80">
                              Omuz, göğüs, kol ve bacak ölçümlerinizi eklemek için &quot;Düzenle&quot; butonuna tıklayabilirsiniz.
                            </p>
                          </div>
                        ) : (
                          /* Kas Ölçüm Kartları Grid (9 Alan) */
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                            {/* Omuz */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Omuz
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.shoulder ? `${mus.shoulder} cm` : "—"}
                              </span>
                            </div>

                            {/* Göğüs */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Göğüs
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.chest ? `${mus.chest} cm` : "—"}
                              </span>
                            </div>

                            {/* Sırt */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sırt
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.back ? `${mus.back} cm` : "—"}
                              </span>
                            </div>

                            {/* Sağ Kol */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sağ Kol
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.rightArm ? `${mus.rightArm} cm` : "—"}
                              </span>
                            </div>

                            {/* Sol Kol */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sol Kol
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.leftArm ? `${mus.leftArm} cm` : "—"}
                              </span>
                            </div>

                            {/* Sağ Bacak */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sağ Bacak
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.rightThigh ? `${mus.rightThigh} cm` : "—"}
                              </span>
                            </div>

                            {/* Sol Bacak */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sol Bacak
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.leftThigh ? `${mus.leftThigh} cm` : "—"}
                              </span>
                            </div>

                            {/* Sağ Baldır */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sağ Baldır
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.rightCalf ? `${mus.rightCalf} cm` : "—"}
                              </span>
                            </div>

                            {/* Sol Baldır */}
                            <div className="rounded-2xl border border-border/60 bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sol Baldır
                              </span>
                              <span className="text-sm font-black text-foreground">
                                {mus?.leftCalf ? `${mus.leftCalf} cm` : "—"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detail Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        <span className="text-xs text-muted">
                          Ölçüm ID: {m.id}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(rec, e)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition cursor-pointer"
                          >
                            <span>✏️</span>
                            <span>Düzenle</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handlePromptDelete(rec, e)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          >
                            <span>🗑️</span>
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. MEASUREMENT MODAL (FOR BOTH CREATE & EDIT MODE) */}
      <MeasurementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        profile={activeProfile}
        initialRecord={editingRecord}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
          loadDashboardData();
        }}
      />

      {/* 6. DELETE CONFIRMATION DIALOG MODAL */}
      {deletingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-2xl font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-foreground">
                  Ölçümü Sil
                </h3>
                <p className="text-xs text-muted">
                  Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground/90">
              <strong className="text-foreground">{formatTurkishDate(deletingRecord.measurement.date)}</strong> tarihli (<strong>{deletingRecord.measurement.weight} kg</strong>) ölçüm kaydını ve bağlı tüm kas ölçümlerini silmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="secondary-button cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
