"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProfileService } from "@/services/profileService";
import { Profile } from "@/domain/bodyTrackingTypes";
import { getProfileStats } from "@/storage/bodyStorage";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [height, setHeight] = useState<number | "">("");
  const [gender, setGender] = useState<"male" | "female">("male");

  const loadData = () => {
    const list = ProfileService.getAll();
    setProfiles(list);
    const active = ProfileService.getActive();
    setActiveId(active ? active.id : "");
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("fit_profiles_updated", handleUpdate);
    window.addEventListener("fit_profile_changed", handleUpdate);
    return () => {
      window.removeEventListener("fit_profiles_updated", handleUpdate);
      window.removeEventListener("fit_profile_changed", handleUpdate);
    };
  }, []);

  const handleSelectActive = (id: string) => {
    ProfileService.setActive(id);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !height) return;

    ProfileService.create({
      firstName,
      lastName,
      height,
      gender,
    });

    setFirstName("");
    setLastName("");
    setHeight("");
    loadData();
  };

  const handleDeleteProfile = (id: string) => {
    ProfileService.delete(id);
    setConfirmDeleteId(null);
    loadData();
  };

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Kullanıcı Profilleri
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Evdeki bireyler için ayrı profiller oluşturun, bağımsız vücut takibi yapın.
          </p>
        </div>

        <Link
          href="/fit/profiles/new"
          className="primary-button px-4 py-2.5 text-xs sm:text-sm font-semibold self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Yeni Profil Ekle</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile List (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Kayıtlı Profiller ({profiles.length})
          </h3>

          {profiles.length === 0 ? (
            <div className="ds-card border-dashed p-8 text-center">
              <p className="text-xs text-muted">Henüz kayıtlı profil bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profiles.map((p) => {
                const isActive = p.id === activeId;
                const stats = getProfileStats(p.id);

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                      isActive
                        ? "border-primary bg-surface-lavender ring-2 ring-primary/15"
                        : "border-border bg-surface hover:border-border-strong"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border text-lg">
                          {p.gender === "male" ? "👨" : "👩"}
                        </span>
                        {isActive ? (
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                            Aktif Profil
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectActive(p.id)}
                            className="secondary-button h-8 px-3 text-xs font-semibold"
                          >
                            Seç
                          </button>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-foreground">
                        {p.firstName} {p.lastName}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">
                        Boy: <strong className="text-foreground">{p.height} cm</strong> • {p.gender === "male" ? "Erkek" : "Kadın"}
                      </p>

                      <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-muted block">Ölçüm Sayısı</span>
                          <span className="font-bold text-foreground">{stats.totalMeasurements} kayıt</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted block">Son Kilo</span>
                          <span className="font-bold text-primary tabular-nums">
                            {stats.latestWeight ? `${stats.latestWeight} kg` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-1 border border-danger/30">
                          <span className="text-[11px] font-medium text-danger">Silinsin mi?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(p.id)}
                            className="text-xs font-bold text-danger hover:underline cursor-pointer"
                          >
                            Evet
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-semibold text-muted hover:text-foreground cursor-pointer"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-danger transition cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          <span>Profili Sil</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Profile Form (Right col) */}
        <div className="ds-card p-6 h-fit space-y-4">
          <h3 className="text-base font-bold text-foreground">
            Yeni Profil Ekle
          </h3>
          <p className="text-xs text-muted">
            Yeni bir kişi ekleyerek ölçümlerini bağımsız takip edebilirsiniz.
          </p>

          <form onSubmit={handleCreateProfile} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Ad *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Örn: Ayşe"
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Soyad
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Örn: Demir"
                className="field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Boy (cm) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max="250"
                  value={height}
                  onChange={(e) =>
                    setHeight(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="168"
                  className="field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Cinsiyet *
                </label>
                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value as "male" | "female")
                  }
                  className="field"
                >
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full primary-button font-semibold py-2.5 mt-2"
            >
              Profili Kaydet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
