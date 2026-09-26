"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { YedekModal } from "./YedekModal";
import { CloudSyncIndicator } from "./CloudSyncIndicator";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
  badge?: string;
  subItems?: { name: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    name: "Ana Sayfa",
    href: "/",
    icon: "🏠",
    description: "Hane genel kontrol paneli",
  },
  {
    name: "Hane Car",
    href: "/cardolist",
    icon: "🚗",
    description: "Araç masraf & bakım takibi",
  },
  {
    name: "Hane Dinner",
    href: "/dinner",
    icon: "🍽️",
    description: "Akşam yemeği & market listesi",
    subItems: [
      { name: "Haftalık Plan", href: "/dinner" },
      { name: "Yemek Kataloğu", href: "/dinner/meals" },
    ],
  },
  {
    name: "Hane Gider",
    href: "/gider",
    icon: "💰",
    description: "Ev bütçesi & ekstre takibi",
  },
  {
    name: "Hane Fit",
    href: "/fit",
    icon: "📐",
    description: "Vücut ölçüleri & yağ takibi",
    subItems: [
      { name: "Profil Seçimi", href: "/fit" },
      { name: "Genel Bakış", href: "/fit/dashboard" },
      { name: "Ölçüm Geçmişi", href: "/fit/measurements" },
      { name: "Yeni Ölçüm", href: "/fit/measurements/new" },
      { name: "Profiller", href: "/fit/profiles" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 flex flex-col border-b border-border bg-surface/95 backdrop-blur-md">
        {/* iOS Status Bar & Dynamic Island Safe Area Spacer */}
        <div style={{ height: "env(safe-area-inset-top, 0px)" }} className="w-full shrink-0" />
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-base text-foreground truncate">
            <img
              src="/logo.png"
              alt="Hane App Logo"
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm"
            />
            <div className="flex flex-col min-w-0">
              <span className="leading-none text-base font-extrabold tracking-tight truncate">Hane App</span>
              <span className="text-[10px] text-muted font-medium truncate">Ev & Yaşam</span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <CloudSyncIndicator variant="compact" />

            <button
              type="button"
              onClick={() => setIsBackupOpen(true)}
              className="flex h-9 items-center gap-1 px-2.5 rounded-xl border border-border bg-surface-raised text-xs font-bold text-foreground shadow-xs cursor-pointer"
              title="Veri Yedekle / İçe Aktar"
            >
              <span>🔄</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-raised text-foreground"
              aria-label="Menüyü aç/kapat"
            >
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* App Logo & Header */}
        <div className="flex h-20 items-center justify-between border-b border-border/70 px-6">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 group"
          >
            <img
              src="/logo.png"
              alt="Hane App Logo"
              className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-foreground">
                Hane App
              </span>
              <span className="text-xs text-muted font-medium">
                Tüm Uygulamalar Tek Çatıda
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-muted hover:text-foreground text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5" aria-label="Ana Menü">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted/80">
            Uygulamalar
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.name} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-3.5 rounded-2xl px-3.5 py-3 transition-all ${
                    active
                      ? "bg-gradient-to-r from-orange-500/15 via-primary/10 to-transparent border border-primary/30 text-primary font-semibold shadow-xs"
                      : "text-foreground/80 hover:bg-surface-raised hover:text-foreground border border-transparent"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised border border-border/60 text-lg group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-muted truncate mt-0.5">
                      {item.description}
                    </span>
                  </div>
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </Link>

                {/* Sub items if active */}
                {item.subItems && active && (
                  <div className="ml-12 pl-2 border-l-2 border-primary/20 space-y-1 py-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        onClick={() => setIsOpen(false)}
                        className={`block rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          pathname === sub.href
                            ? "text-primary font-semibold bg-primary/10"
                            : "text-muted hover:text-foreground hover:bg-surface-raised"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer info & Backup button in Sidebar */}
        <div className="border-t border-border/70 p-4 space-y-2.5">
          {/* Cloud Sync Status Pill */}
          <CloudSyncIndicator variant="sidebar" />

          {/* Backup / Export button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsBackupOpen(true);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-surface-raised/50 hover:bg-surface border border-border/60 text-foreground transition cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                🔄
              </span>
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Manuel Yedek İndir / Yükle
              </span>
            </div>
            <span className="text-xs text-muted group-hover:text-foreground">→</span>
          </button>
        </div>
      </aside>

      {/* Universal Backup Modal */}
      <YedekModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </>
  );
}
