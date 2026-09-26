"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProfileService } from "@/services/profileService";
import { Profile } from "@/domain/bodyTrackingTypes";
import { getProfileStats } from "@/storage/bodyStorage";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string>("");
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

  const handleDeleteProfile = (id: string, name: string) => {
    if (
      confirm(
        `"${name}" profilini ve bu profile ait tüm ölçüm geçmişini silmek istediğinize emin misiniz?`
      )
    ) {
      ProfileService.delete(id);
      loadData();
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Kullanıcı Profilleri
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Evdeki bireyler için ayrı profiller oluşturun, bağımsız vücut takibi yapın.
          </p>
        </div>

        <Link
          href="/fit/profiles/new"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition self-start sm:self-auto"
        >
          <span>+</span>
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
            <div className="rounded-3xl border border-dashed border-border p-8 text-center bg-surface">
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
                    className={`rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                      isActive
                        ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                        : "border-border/80 bg-surface hover:border-emerald-500/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-raised border border-border/60 text-lg">
                          {p.gender === "male" ? "👨" : "👩"}
                        </span>
                        {isActive ? (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Aktif Profil
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectActive(p.id)}
                            className="rounded-xl border border-border bg-surface-raised px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground hover:border-emerald-500/40 transition cursor-pointer"
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

                      <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-muted block">Ölçüm Sayısı</span>
                          <span className="font-bold text-foreground">{stats.totalMeasurements} kayıt</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted block">Son Kilo</span>
                          <span className="font-bold text-emerald-600">
                            {stats.latestWeight ? `${stats.latestWeight} kg` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteProfile(p.id, `${p.firstName} ${p.lastName}`)}
                        className="text-xs text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                      >
                        Profili Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Profile Form (Right col) */}
        <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-xs h-fit space-y-4">
          <h3 className="text-base font-bold text-foreground">
            Yeni Profil Ekle
          </h3>
          <p className="text-xs text-muted">
            Yeni bir kişi ekleyerek ölçümlerini bağımsız takip edebilirsiniz.
          </p>

          <form onSubmit={handleCreateProfile} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
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
              <label className="block text-xs font-bold text-foreground mb-1">
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
                <label className="block text-xs font-bold text-foreground mb-1">
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
                <label className="block text-xs font-bold text-foreground mb-1">
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
              className="w-full primary-button bg-emerald-600 hover:bg-emerald-700 font-bold py-2.5 mt-2"
            >
              Profili Kaydet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
