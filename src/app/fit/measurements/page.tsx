"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getProfiles,
  getActiveProfileId,
  getFullMeasurementRecords,
  deleteMeasurement,
} from "@/storage/bodyStorage";
import { Profile, FullMeasurementRecord } from "@/domain/bodyTrackingTypes";
import { MeasurementModal } from "@/components/fit/MeasurementModal";

export default function MeasurementsHistoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<FullMeasurementRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    const all = getProfiles();
    setProfiles(all);
    const activeId = getActiveProfileId();
    const current = all.find((p) => p.id === activeId) || all[0] || null;
    setActiveProfile(current);

    if (current) {
      const recs = getFullMeasurementRecords(current.id);
      setRecords(recs);
    } else {
      setRecords([]);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();

    const handleProfileChange = () => loadData();
    window.addEventListener("fit_profile_changed", handleProfileChange);
    window.addEventListener("fit_measurements_updated", handleProfileChange);
    return () => {
      window.removeEventListener("fit_profile_changed", handleProfileChange);
      window.removeEventListener("fit_measurements_updated", handleProfileChange);
    };
  }, []);

  const handleDelete = (id: string, date: string) => {
    if (confirm(`${date} tarihli ölçüm kaydını silmek istediğinize emin misiniz?`)) {
      deleteMeasurement(id);
      loadData();
      window.dispatchEvent(new Event("fit_measurements_updated"));
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Ölçüm Geçmişi
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            {activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName} için toplam ${records.length} ölçüm` : "Ölçüm listesi"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition cursor-pointer"
        >
          <span>+</span>
          <span>Yeni Ölçüm Ekle</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center bg-surface">
          <span className="text-3xl mb-2 block">📋</span>
          <h3 className="text-base font-bold text-foreground">
            Kayıtlı Ölçüm Bulunmuyor
          </h3>
          <p className="mt-1 text-xs text-muted">
            İlk vücut ölçümünüzü ekleyerek takip etmeye başlayabilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
          >
            Ölçüm Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec, index) => {
            const m = rec.measurement;
            const mus = rec.muscle;
            const isExpanded = expandedId === m.id;
            const prevRecord = records[index + 1];
            const weightDiff = prevRecord
              ? Number((m.weight - prevRecord.measurement.weight).toFixed(1))
              : null;

            return (
              <div
                key={m.id}
                className="rounded-3xl border border-border/80 bg-surface p-5 shadow-xs hover:border-emerald-500/40 transition-all space-y-4"
              >
                {/* Main Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                      #{records.length - index}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">
                          {m.date}
                        </span>
                        {weightDiff !== null && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              weightDiff < 0
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : weightDiff > 0
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-slate-500/15 text-muted"
                            }`}
                          >
                            {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted">
                        Kayıt ID: {m.id.slice(-8)}
                      </span>
                    </div>
                  </div>

                  {/* Core Highlight Stats */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Kilo
                      </span>
                      <span className="text-lg font-black text-foreground">
                        {m.weight} <span className="text-xs font-normal text-muted">kg</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Yağ Oranı
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {m.bodyFat !== undefined && m.bodyFat !== null ? `${m.bodyFat}%` : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Bel / Boyun
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {m.waist} / {m.neck} <span className="text-xs font-normal text-muted">cm</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 border-l border-border/70">
                      {mus && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : m.id)}
                          className="rounded-xl border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 transition cursor-pointer"
                        >
                          {isExpanded ? "Detayı Kapat" : "Kas Ölçüleri"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.date)}
                        className="rounded-xl border border-border/60 bg-surface-raised p-1.5 text-muted hover:text-rose-600 hover:border-rose-400/40 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Ölçümü Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Muscle Measurements Drawer */}
                {isExpanded && mus && (
                  <div className="pt-4 border-t border-border/70 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                      Kas ve Çevre Detayları (cm)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                      {mus.shoulder && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Omuz</span>
                          <span className="text-sm font-bold text-foreground">{mus.shoulder}</span>
                        </div>
                      )}
                      {mus.chest && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Göğüs</span>
                          <span className="text-sm font-bold text-foreground">{mus.chest}</span>
                        </div>
                      )}
                      {mus.back && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Sırt</span>
                          <span className="text-sm font-bold text-foreground">{mus.back}</span>
                        </div>
                      )}
                      {mus.rightArm && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Sağ Kol</span>
                          <span className="text-sm font-bold text-foreground">{mus.rightArm}</span>
                        </div>
                      )}
                      {mus.leftArm && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Sol Kol</span>
                          <span className="text-sm font-bold text-foreground">{mus.leftArm}</span>
                        </div>
                      )}
                      {mus.rightThigh && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Sağ Bacak</span>
                          <span className="text-sm font-bold text-foreground">{mus.rightThigh}</span>
                        </div>
                      )}
                      {mus.leftThigh && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Sol Bacak</span>
                          <span className="text-sm font-bold text-foreground">{mus.leftThigh}</span>
                        </div>
                      )}
                      {mus.rightCalf && (
                        <div className="rounded-2xl bg-surface-raised p-2.5 text-center border border-border/40">
                          <span className="text-[10px] text-muted block">Sağ Kalf</span>
                          <span className="text-sm font-bold text-foreground">{mus.rightCalf}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Measurement Modal */}
      {activeProfile && (
        <MeasurementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          profile={activeProfile}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
