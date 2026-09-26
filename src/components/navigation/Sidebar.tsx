"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
    name: "CarDo",
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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-lg shadow-sm text-white">
            🏡
          </span>
          <div className="flex flex-col">
            <span className="leading-none text-base font-extrabold tracking-tight">Hane App</span>
            <span className="text-[10px] text-muted font-medium">Ev & Yaşam Yönetimi</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-raised text-foreground"
          aria-label="Menüyü aç/kapat"
        >
          {isOpen ? "✕" : "☰"}
        </button>
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
      >
        {/* App Logo & Header */}
        <div className="flex h-20 items-center justify-between border-b border-border/70 px-6">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 group"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-xl shadow-md text-white group-hover:scale-105 transition-transform">
              🏡
            </span>
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
            className="lg:hidden text-muted hover:text-foreground text-lg"
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

        {/* Footer info in Sidebar */}
        <div className="border-t border-border/70 p-4">
          <div className="rounded-2xl bg-surface-raised/70 border border-border/60 p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary text-base">
              ✨
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground truncate">Hane Sistemi Aktif</span>
              <span className="text-[10px] text-muted truncate">4 Modül Entegre Edildi</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
