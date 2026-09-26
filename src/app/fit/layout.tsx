"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileService } from "@/services/profileService";
import { Profile } from "@/domain/bodyTrackingTypes";

export default function FitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  const loadProfileData = () => {
    const list = ProfileService.getAll();
    setProfiles(list);
    const active = ProfileService.getActive();
    setActiveId(active ? active.id : "");
    setIsLoaded(true);
  };

  useEffect(() => {
    loadProfileData();

    const handleStorage = () => loadProfileData();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("fit_profiles_updated", handleStorage);
    window.addEventListener("fit_profile_changed", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("fit_profiles_updated", handleStorage);
      window.removeEventListener("fit_profile_changed", handleStorage);
    };
  }, []);

  const handleProfileChange = (id: string) => {
    ProfileService.setActive(id);
    setActiveId(id);
    router.refresh();
  };

  const navTabs = [
    { label: "👥 Profil Seç", href: "/fit" },
    { label: "Genel Bakış", href: "/fit/dashboard" },
    { label: "Ölçüm Geçmişi", href: "/fit/measurements" },
    { label: "Yeni Ölçüm", href: "/fit/measurements/new" },
    { label: "Profiller", href: "/fit/profiles" },
  ];

  const isSelectionScreen = pathname === "/fit" || pathname === "/fit/profiles/new";

  return (
    <div className="space-y-6">
      {/* App Header & Navigation */}
      {!isSelectionScreen && (
        <div className="flex flex-col gap-4 border-b border-border/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-2xl shadow-md text-white">
                📐
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    Hane Fit
                  </h1>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Body Tracker
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted">
                  Kilo, vücut ölçüleri ve tahmini yağ oranı takibi
                </p>
              </div>
            </div>

            {/* Profile Switcher & Add Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isLoaded && profiles.length > 0 ? (
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-1.5 shadow-xs">
                  <span className="text-xs text-muted font-medium">Profil:</span>
                  <select
                    value={activeProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-foreground outline-none cursor-pointer pr-2"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id} className="bg-surface text-foreground">
                        {p.firstName} {p.lastName} ({p.height} cm)
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <Link
                href="/fit/profiles/new"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-border/80 bg-surface-raised px-3 py-2 text-xs font-semibold text-foreground hover:border-emerald-500/50 hover:text-emerald-600 transition shadow-xs cursor-pointer"
              >
                <span>+</span>
                <span>Yeni Profil</span>
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 overflow-x-auto pt-2 scrollbar-none">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "text-muted hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Fit Content */}
      <div>{children}</div>
    </div>
  );
}
