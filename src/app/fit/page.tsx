"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileService } from "@/services/profileService";
import { Profile } from "@/domain/bodyTrackingTypes";
import { getProfileStats } from "@/storage/bodyStorage";

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-blue-500 to-indigo-700",
  "from-violet-500 to-purple-800",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-teal-600",
];

export default function FitProfileSelectPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = () => {
    const list = ProfileService.getAll();
    setProfiles(list);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("fit_profiles_updated", handleUpdate);
    return () => {
      window.removeEventListener("fit_profiles_updated", handleUpdate);
    };
  }, []);

  const handleSelectProfile = (profileId: string) => {
    ProfileService.setActive(profileId);
    router.push("/fit/dashboard");
  };

  const getInitials = (first: string, last?: string) => {
    const f = first ? first[0].toUpperCase() : "";
    const l = last ? last[0].toUpperCase() : "";
    return `${f}${l}` || "👤";
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center py-8 sm:py-12 px-4 overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-5xl text-center space-y-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 backdrop-blur-md">
            <span>⚡</span> HANE FIT • VÜCUT VE GELİŞİM TAKİBİ
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Kim takip ediyor?
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
            Ölçümlerinizi incelemek ve yeni kayıt girmek için profilinizi seçin.
          </p>
        </div>

        {/* Profiles Grid / Empty State */}
        {profiles.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto rounded-3xl border border-dashed border-border/90 bg-surface/70 backdrop-blur-md p-8 sm:p-10 text-center space-y-5 shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-4xl shadow-inner">
              🏃
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">
                Henüz bir profil oluşturmadın
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Kilo, boyun, bel ve kol ölçümlerinizi zaman içinde takip etmek için ilk profilinizi oluşturun.
              </p>
            </div>
            <Link
              href="/fit/profiles/new"
              className="primary-button bg-emerald-600 hover:bg-emerald-700 w-full py-3 text-sm font-bold shadow-md shadow-emerald-600/20"
            >
              + İlk Profili Oluştur
            </Link>
          </div>
        ) : (
          /* Profile Cards List */
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-2">
            {profiles.map((p, index) => {
              const gradient =
                AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
              const stats = getProfileStats(p.id);
              const initials = getInitials(p.firstName, p.lastName);

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p.id)}
                  className="group relative flex flex-col items-center cursor-pointer select-none"
                >
                  {/* Card Avatar Box */}
                  <div className="relative flex flex-col items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-surface border-2 border-border/80 p-3 shadow-sm group-hover:border-emerald-500 group-hover:shadow-xl group-hover:shadow-emerald-500/15 group-hover:scale-105 group-active:scale-95 transition-all duration-200">
                    {/* Inner Gradient Avatar */}
                    <div
                      className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white font-black text-2xl sm:text-3xl shadow-md group-hover:scale-105 transition-transform duration-200`}
                    >
                      {initials}
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-muted group-hover:text-foreground transition-colors">
                      {stats.latestWeight ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {stats.latestWeight} kg
                        </span>
                      ) : (
                        <span>{p.height} cm</span>
                      )}
                      <span>•</span>
                      <span>{stats.totalMeasurements} kayıt</span>
                    </div>

                    {/* Gender Icon Badge */}
                    <span className="absolute top-2.5 right-2.5 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                      {p.gender === "male" ? "👨" : "👩"}
                    </span>
                  </div>

                  {/* Profile Name */}
                  <span className="mt-3 text-base sm:text-lg font-bold text-foreground/90 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-105 transition-all duration-200">
                    {p.firstName} {p.lastName}
                  </span>
                </div>
              );
            })}

            {/* "+ Profil Oluştur" Card */}
            <Link
              href="/fit/profiles/new"
              className="group relative flex flex-col items-center cursor-pointer select-none"
            >
              <div className="flex flex-col items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-3xl border-2 border-dashed border-border/80 bg-surface/50 hover:bg-surface p-4 group-hover:border-emerald-500/80 group-hover:scale-105 group-active:scale-95 transition-all duration-200">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-surface-raised border border-border/80 text-2xl sm:text-3xl font-light text-muted group-hover:text-emerald-500 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all duration-200">
                  +
                </div>
                <span className="mt-3 text-xs sm:text-sm font-semibold text-muted group-hover:text-foreground transition-colors">
                  Profil Ekle
                </span>
              </div>
              <span className="mt-3 text-sm sm:text-base font-medium text-muted group-hover:text-foreground transition-colors">
                + Profil Oluştur
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
