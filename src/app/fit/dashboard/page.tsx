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
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  UserIcon,
  CalendarIcon,
} from "@/components/ui/Icons";

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
        className={`font-bold inline-flex items-center gap-0.5 tabular-nums ${
          change.direction === "decrease"
            ? "text-success"
            : change.direction === "increase"
            ? "text-warning"
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
        recs.sort((a, b) => new Date(b.measurement.date).getTime() - new Date(a.measurement.date).getTime());
        setRecords(recs);
        setStats(getProfileStats(all[0].id));
      } else {
        router.push("/fit");
      }
    } else {
      setActiveProfile(profile);
      const recs = getFullMeasurementRecords(profile.id);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const latestRecord = records[0];

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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. TOP PROFILE HEADER SECTION */}
      <section className="ds-card p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar & Profile Bio */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl sm:text-2xl shadow-xs">
              {initials}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-surface border border-border text-xs shadow-xs">
                {activeProfile.gender === "male" ? "👨" : "👩"}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {activeProfile.firstName} {activeProfile.lastName}
                </h2>
                <span className="rounded-full bg-surface-lavender border border-border-lavender px-2.5 py-0.5 text-xs font-bold text-primary">
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
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <Link
              href="/fit/profiles"
              className="secondary-button h-10 px-4 text-xs sm:text-sm font-semibold"
            >
              <UserIcon className="w-4 h-4" />
              <span>Profiller</span>
            </Link>

            <button
              onClick={handleOpenAddModal}
              className="primary-button h-10 px-5 text-xs sm:text-sm font-semibold"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Ölçüm Ekle</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN SECTION: SON ÖLÇÜM ÖZETİ OR EMPTY STATE */}
      {records.length === 0 ? (
        <section className="ds-card border-dashed p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-lavender border border-border-lavender text-3xl">
            ⚖️
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Henüz ölçüm eklenmedi
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Kilonuzu, bel ve boyun ölçülerinizi kaydederek vücut yağ oranı ve gelişim grafiğinizi oluşturmaya hemen başlayın.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenAddModal}
              className="primary-button px-6 py-3 text-sm font-semibold"
            >
              <PlusIcon className="w-4 h-4" />
              <span>İlk Ölçümünü Ekle</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Son Ölçüm Özeti
              </h2>
              <p className="text-xs text-muted">
                Kişisel vücut kompozisyonunuzun güncel durumu ve gelişim farkları
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary bg-surface px-3 py-1.5 rounded-xl border border-border">
              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
              <span>{formatTurkishDate(latestRecord.measurement.date)}</span>
            </div>
          </div>

          {/* 4 Big Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Kilo */}
            <div className="ds-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Kilo
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-base">
                  ⚖️
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {latestRecord.measurement.weight}
                  </span>
                  <span className="text-sm font-bold text-muted">kg</span>
                </div>

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
            <div className="ds-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Yağ Oranı
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-base">
                  🎯
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {latestRecord.measurement.bodyFat !== undefined && latestRecord.measurement.bodyFat !== null
                      ? `${latestRecord.measurement.bodyFat}%`
                      : "—"}
                  </span>
                  {bodyFatInfo && (
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-bold bg-surface-raised border border-border ${bodyFatInfo.color}`}
                    >
                      {bodyFatInfo.label}
                    </span>
                  )}
                </div>

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
            <div className="ds-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Bel Çevresi
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-base">
                  📐
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {latestRecord.measurement.waist ? latestRecord.measurement.waist : "—"}
                  </span>
                  {latestRecord.measurement.waist ? (
                    <span className="text-sm font-bold text-muted">cm</span>
                  ) : null}
                </div>

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
            <div className="ds-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Son Ölçüm
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-base">
                  📅
                </span>
              </div>

              <div className="mt-4">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground block leading-tight">
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

      {/* 3. PROGRESS & EVOLUTION CHARTS SECTION */}
      <ProgressCharts records={records} gender={activeProfile.gender} />

      {/* 4. PROMINENT CALL TO ACTION BANNER */}
      <section className="ds-card-lavender p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-bold text-primary border border-border-lavender">
            ⚡ HIZLI TAKİP
          </span>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Yeni bir ölçüm kaydetmek ister misiniz?
          </h3>
          <p className="text-xs sm:text-sm text-foreground-secondary">
            Düzenli haftalık ölçümler form grafiğinizin doğruluğunu artırır.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="primary-button px-6 py-3 text-sm font-semibold self-start sm:self-auto shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Ölçüm Ekle</span>
        </button>
      </section>

      {/* 5. GEÇMİŞ ÖLÇÜMLER SECTION */}
      <section className="ds-card p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>📊</span>
              <span>Geçmiş Ölçümler</span>
            </h3>
            <p className="text-xs text-muted">
              Tarih sırasına göre kaydedilmiş tüm ölçüm detayları ve kas gelişim raporları
            </p>
          </div>

          <span className="text-xs font-bold text-muted bg-surface-raised px-3 py-1.5 rounded-xl border border-border self-start sm:self-auto">
            Toplam: <strong className="text-foreground">{records.length} Kayıt</strong>
          </span>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-surface-raised/50 space-y-3">
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
              className="primary-button px-4 py-2 text-xs font-semibold mt-2"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>İlk Ölçümünü Ekle</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {records.map((rec, idx) => {
              const m = rec.measurement;
              const mus = rec.muscle;
              const isExpanded = expandedRecordId === m.id;

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

              const recordBMI = calculateBMI(m.weight, activeProfile.height);
              const recordBMICat = recordBMI ? getBMICategory(recordBMI) : null;
              const recordBodyFatCat =
                m.bodyFat !== undefined && m.bodyFat !== null
                  ? getBodyFatCategory(activeProfile.gender, m.bodyFat)
                  : null;

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                    isExpanded
                      ? "border-primary bg-surface shadow-sm"
                      : "border-border bg-surface-raised/50 hover:bg-surface-raised hover:border-border-strong"
                  }`}
                >
                  {/* Card Main Clickable Header */}
                  <div
                    onClick={() => toggleExpand(m.id)}
                    className="p-4 sm:p-5 cursor-pointer select-none space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-primary font-bold text-xs">
                          #{records.length - idx}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-bold text-foreground">
                              {formatTurkishDate(m.date)}
                            </span>
                            {idx === 0 && (
                              <span className="rounded-full bg-surface-lavender border border-border-lavender px-2 py-0.5 text-[10px] font-bold text-primary">
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
                          className="secondary-button h-8 px-3 text-xs font-semibold"
                          title="Ölçümü Düzenle"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                          <span>Düzenle</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handlePromptDelete(rec, e)}
                          className="secondary-button h-8 px-3 text-xs font-semibold text-muted hover:text-danger hover:border-danger/30 hover:bg-danger-soft"
                          title="Ölçümü Sil"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(m.id);
                          }}
                          className="icon-button h-8 w-8 ml-1"
                          aria-label="Detayı Göster/Gizle"
                        >
                          <ChevronDownIcon
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-3 border-t border-border/60">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Kilo
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-foreground tabular-nums">
                            {m.weight}
                          </span>
                          <span className="text-xs font-medium text-muted">kg</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Yağ Oranı
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-primary tabular-nums">
                            {m.bodyFat !== undefined && m.bodyFat !== null
                              ? `${m.bodyFat}%`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Bel
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-foreground tabular-nums">
                            {m.waist ? m.waist : "—"}
                          </span>
                          {m.waist ? (
                            <span className="text-xs font-medium text-muted">cm</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Boyun
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-foreground tabular-nums">
                            {m.neck ? m.neck : "—"}
                          </span>
                          {m.neck ? (
                            <span className="text-xs font-medium text-muted">cm</span>
                          ) : null}
                        </div>
                      </div>

                      {activeProfile.gender === "female" && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                            Kalça
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-foreground tabular-nums">
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
                    <div className="border-t border-border bg-surface p-5 sm:p-6 space-y-6 animate-in fade-in duration-150">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                          <span>📐</span>
                          <span>Vücut ve Kompozisyon Detayları</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="rounded-xl border border-border bg-surface-raised p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted block">
                              Ağırlık / BMI
                            </span>
                            <div className="text-sm font-bold text-foreground tabular-nums">
                              {m.weight} kg
                            </div>
                            {recordBMI && recordBMICat && (
                              <span className={`text-[10px] font-bold block ${recordBMICat.color}`}>
                                BMI {recordBMI} ({recordBMICat.label})
                              </span>
                            )}
                          </div>

                          <div className="rounded-xl border border-border bg-surface-raised p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted block">
                              Vücut Yağ Oranı
                            </span>
                            <div className="text-sm font-bold text-primary tabular-nums">
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

                          <div className="rounded-xl border border-border bg-surface-raised p-3.5 space-y-1">
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

                          <div className="rounded-xl border border-border bg-surface-raised p-3.5 space-y-1">
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
                            <span className="text-[10px] font-bold text-primary bg-surface-lavender px-2 py-0.5 rounded-lg border border-border-lavender">
                              9 Bölge Takibi
                            </span>
                          )}
                        </div>

                        {!hasMuscleData ? (
                          <div className="rounded-xl border border-dashed border-border bg-surface-raised/50 p-4 text-center space-y-1">
                            <p className="text-xs font-semibold text-muted">
                              ⚠️ Bu kayıt için kas ölçümü girilmemiştir.
                            </p>
                            <p className="text-[11px] text-muted">
                              Omuz, göğüs, kol ve bacak ölçümlerinizi eklemek için &quot;Düzenle&quot; butonuna tıklayabilirsiniz.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Omuz
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.shoulder ? `${mus.shoulder} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Göğüs
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.chest ? `${mus.chest} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sırt
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.back ? `${mus.back} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sağ Kol
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.rightArm ? `${mus.rightArm} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sol Kol
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.leftArm ? `${mus.leftArm} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sağ Bacak
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.rightThigh ? `${mus.rightThigh} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sol Bacak
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.leftThigh ? `${mus.leftThigh} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sağ Baldır
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
                                {mus?.rightCalf ? `${mus.rightCalf} cm` : "—"}
                              </span>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-raised p-2.5 text-center">
                              <span className="text-[10px] font-bold text-muted block uppercase">
                                Sol Baldır
                              </span>
                              <span className="text-sm font-bold text-foreground tabular-nums">
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
                            className="primary-button px-4 py-2 text-xs font-semibold"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>Düzenle</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handlePromptDelete(rec, e)}
                            className="danger-button px-4 py-2 text-xs font-semibold"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
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

      {/* 6. MEASUREMENT MODAL */}
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

      {/* 7. DELETE CONFIRMATION DIALOG MODAL */}
      {deletingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger text-xl font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  Ölçümü Sil
                </h3>
                <p className="text-xs text-muted">
                  Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground-secondary">
              <strong className="text-foreground">{formatTurkishDate(deletingRecord.measurement.date)}</strong> tarihli (<strong>{deletingRecord.measurement.weight} kg</strong>) ölçüm kaydını ve bağlı tüm kas ölçümlerini silmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="secondary-button"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="danger-button px-5 py-2.5 text-xs sm:text-sm font-semibold"
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
