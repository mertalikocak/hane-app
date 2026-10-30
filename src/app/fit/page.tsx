"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileService } from "@/services/profileService";
import { Profile } from "@/domain/bodyTrackingTypes";
import { getProfileStats } from "@/storage/bodyStorage";
import { FitIcon, PlusIcon } from "@/components/ui/Icons";

const AVATAR_STYLES = [
  "bg-primary text-primary-foreground",
  "bg-sky-600 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-pink-600 text-white",
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
    const active = ProfileService.getActive();
    if (active) {
      router.replace("/fit/dashboard");
      return;
    }
    loadData();

    const handleUpdate = () => {
      const updatedActive = ProfileService.getActive();
      if (updatedActive) {
        router.replace("/fit/dashboard");
      } else {
        loadData();
      }
    };
    window.addEventListener("fit_profiles_updated", handleUpdate);
    return () => {
      window.removeEventListener("fit_profiles_updated", handleUpdate);
    };
  }, [router]);

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-4xl text-center space-y-8 animate-in fade-in duration-200">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-lavender bg-surface-lavender px-3.5 py-1 text-xs font-bold text-primary">
            <FitIcon className="w-3.5 h-3.5" />
            <span>HANE FIT • VÜCUT VE GELİŞİM TAKİBİ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Kim takip ediyor?
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
            Ölçümlerinizi incelemek ve yeni kayıt girmek için profilinizi seçin.
          </p>
        </div>

        {/* Profiles Grid / Empty State */}
        {profiles.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto ds-card border-dashed p-8 sm:p-10 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-lavender border border-border-lavender text-primary">
              <FitIcon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                Henüz bir profil oluşturmadın
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Kilo, boyun, bel ve kol ölçümlerinizi zaman içinde takip etmek için ilk profilinizi oluşturun.
              </p>
            </div>
            <Link
              href="/fit/profiles/new"
              className="primary-button w-full py-3 text-sm font-semibold"
            >
              <PlusIcon className="w-4 h-4" />
              <span>İlk Profili Oluştur</span>
            </Link>
          </div>
        ) : (
          /* Profile Cards List */
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 pt-2">
            {profiles.map((p, index) => {
              const avatarStyle = AVATAR_STYLES[index % AVATAR_STYLES.length];
              const stats = getProfileStats(p.id);
              const initials = getInitials(p.firstName, p.lastName);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProfile(p.id)}
                  className="group relative flex flex-col items-center cursor-pointer select-none text-center"
                >
                  {/* Card Avatar Box */}
                  <div className="relative flex flex-col items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-surface border border-border p-3 shadow-xs group-hover:border-primary group-hover:shadow-md transition-all duration-150">
                    {/* Inner Avatar */}
                    <div
                      className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl ${avatarStyle} font-bold text-2xl sm:text-3xl shadow-xs`}
                    >
                      {initials}
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-muted group-hover:text-foreground transition-colors">
                      {stats.latestWeight ? (
                        <span className="text-primary">
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
                  <span className="mt-2.5 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {p.firstName} {p.lastName}
                  </span>
                </button>
              );
            })}

            {/* "+ Profil Oluştur" Card */}
            <Link
              href="/fit/profiles/new"
              className="group relative flex flex-col items-center cursor-pointer select-none"
            >
              <div className="flex flex-col items-center justify-center w-36 h-36 sm:w-44 sm:h-44 rounded-2xl border border-dashed border-border-strong bg-surface/60 hover:bg-surface p-4 group-hover:border-primary transition-all duration-150">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-surface-raised border border-border text-muted group-hover:text-primary group-hover:bg-surface-lavender group-hover:border-border-lavender transition-all duration-150">
                  <PlusIcon className="w-6 h-6" />
                </div>
                <span className="mt-3 text-xs sm:text-sm font-semibold text-muted group-hover:text-foreground transition-colors">
                  Profil Ekle
                </span>
              </div>
              <span className="mt-2.5 text-sm font-semibold text-muted group-hover:text-primary transition-colors">
                + Profil Oluştur
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
