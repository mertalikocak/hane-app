"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileService } from "@/services/profileService";
import { Profile } from "@/domain/bodyTrackingTypes";
import { PageHeader } from "@/components/ui/PageHeader";
import { FitIcon, PlusIcon, UserIcon } from "@/components/ui/Icons";

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
    { label: "Genel Bakış", href: "/fit/dashboard" },
    { label: "Ölçüm Geçmişi", href: "/fit/measurements" },
    { label: "Yeni Ölçüm", href: "/fit/measurements/new" },
    { label: "Profiller & Ayarlar", href: "/fit/profiles" },
  ];

  const isSelectionScreen = pathname === "/fit" || pathname === "/fit/profiles/new";

  return (
    <div className="space-y-6">
      {/* App Header & Navigation */}
      {!isSelectionScreen && (
        <div className="space-y-4">
          <PageHeader
            title="Hane Fit"
            description="Kilo, vücut ölçüleri ve tahmini yağ oranı takibi"
            icon={<FitIcon className="w-6 h-6" />}
            badge="Vücut Takibi"
            action={
              <div className="flex items-center gap-2 flex-wrap">
                {isLoaded && profiles.length > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 h-10 shadow-xs">
                    <UserIcon className="w-4 h-4 text-muted shrink-0" />
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
                  className="secondary-button h-10 px-3.5 text-xs font-semibold"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Yeni Profil</span>
                </Link>
              </div>
            }
          />

          {/* Tab Navigation */}
          <nav className="inline-flex items-center gap-1 p-1 rounded-2xl bg-background-subtle border border-border overflow-x-auto max-w-full scrollbar-none">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-surface text-foreground shadow-xs border border-border"
                      : "text-muted hover:text-foreground"
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
