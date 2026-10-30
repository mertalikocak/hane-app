"use client";

import { useEffect, useState } from "react";
import {
  getProfiles,
  getActiveProfileId,
  getFullMeasurementRecords,
  deleteMeasurement,
} from "@/storage/bodyStorage";
import { Profile, FullMeasurementRecord } from "@/domain/bodyTrackingTypes";
import { MeasurementModal } from "@/components/fit/MeasurementModal";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";

export default function MeasurementsHistoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<FullMeasurementRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  const handleDelete = (id: string) => {
    deleteMeasurement(id);
    setConfirmDeleteId(null);
    loadData();
    window.dispatchEvent(new Event("fit_measurements_updated"));
  };

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Ölçüm Geçmişi
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            {activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName} için toplam ${records.length} ölçüm` : "Ölçüm listesi"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="primary-button px-4 py-2 text-xs sm:text-sm font-semibold self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Yeni Ölçüm Ekle</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="ds-card border-dashed p-10 text-center space-y-3">
          <span className="text-3xl mb-1 block">📋</span>
          <h3 className="text-base font-bold text-foreground">
            Kayıtlı Ölçüm Bulunmuyor
          </h3>
          <p className="text-xs text-muted">
            İlk vücut ölçümünüzü ekleyerek takip etmeye başlayabilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="primary-button px-4 py-2 text-xs font-semibold mt-2"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Ölçüm Ekle</span>
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
                className="ds-card p-5 space-y-4"
              >
                {/* Main Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-primary font-bold text-sm">
                      #{records.length - index}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">
                          {m.date}
                        </span>
                        {weightDiff !== null && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                              weightDiff < 0
                                ? "bg-success-soft text-success"
                                : weightDiff > 0
                                ? "bg-warning-soft text-warning"
                                : "bg-surface-raised text-muted"
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
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Kilo
                      </span>
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {m.weight} <span className="text-xs font-normal text-muted">kg</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Yağ Oranı
                      </span>
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {m.bodyFat !== undefined && m.bodyFat !== null ? `${m.bodyFat}%` : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Bel / Boyun
                      </span>
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {m.waist || "—"} / {m.neck || "—"} <span className="text-xs font-normal text-muted">cm</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                      {mus && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : m.id)}
                          className="secondary-button h-8 px-3 text-xs font-semibold"
                        >
                          {isExpanded ? "Detayı Kapat" : "Kas Ölçüleri"}
                        </button>
                      )}

                      {confirmDeleteId === m.id ? (
                        <div className="flex items-center gap-1 rounded-xl bg-danger-soft px-2.5 py-1 border border-danger/30">
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="text-xs font-bold text-danger hover:underline cursor-pointer"
                          >
                            Sil
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-semibold text-muted hover:text-foreground cursor-pointer ml-1.5"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(m.id)}
                          className="icon-button h-8 w-8 hover:text-danger hover:border-danger/30 hover:bg-danger-soft"
                          title="Ölçümü Sil"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Muscle Measurements Drawer */}
                {isExpanded && mus && (
                  <div className="pt-4 border-t border-border animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                      Kas ve Çevre Detayları (cm)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                      {mus.shoulder && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Omuz</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.shoulder}</span>
                        </div>
                      )}
                      {mus.chest && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Göğüs</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.chest}</span>
                        </div>
                      )}
                      {mus.back && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Sırt</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.back}</span>
                        </div>
                      )}
                      {mus.rightArm && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Sağ Kol</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.rightArm}</span>
                        </div>
                      )}
                      {mus.leftArm && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Sol Kol</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.leftArm}</span>
                        </div>
                      )}
                      {mus.rightThigh && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Sağ Bacak</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.rightThigh}</span>
                        </div>
                      )}
                      {mus.leftThigh && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Sol Bacak</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.leftThigh}</span>
                        </div>
                      )}
                      {mus.rightCalf && (
                        <div className="rounded-xl bg-surface-raised p-2.5 text-center border border-border">
                          <span className="text-[10px] text-muted block">Sağ Kalf</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{mus.rightCalf}</span>
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
