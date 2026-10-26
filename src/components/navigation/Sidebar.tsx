"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { YedekModal } from "./YedekModal";
import { CloudSyncIndicator } from "./CloudSyncIndicator";
import { ProfileHeaderMenu } from "@/components/profile/ProfileHeaderMenu";
import { NotificationBellButton } from "@/components/notifications/NotificationBellButton";
import { SidebarOrderModal } from "./SidebarOrderModal";
import {
  DEFAULT_NAV_ITEMS,
  getCustomSidebarOrder,
  getHiddenSidebarItems,
  getSortedNavItems,
  type NavItem,
} from "@/storage/sidebarStorage";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_NAV_ITEMS;
    return getSortedNavItems(
      DEFAULT_NAV_ITEMS,
      getCustomSidebarOrder(),
      getHiddenSidebarItems()
    );
  });

  const refreshNavItems = () => {
    setNavItems(
      getSortedNavItems(
        DEFAULT_NAV_ITEMS,
        getCustomSidebarOrder(),
        getHiddenSidebarItems()
      )
    );
  };

  useEffect(() => {
    refreshNavItems();
    const handleOrderChange = () => {
      refreshNavItems();
    };
    window.addEventListener("hane_sidebar_order_changed", handleOrderChange);
    window.addEventListener("storage", handleOrderChange);
    return () => {
      window.removeEventListener("hane_sidebar_order_changed", handleOrderChange);
      window.removeEventListener("storage", handleOrderChange);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/gider") return pathname === "/gider";
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
              <span className="text-[11px] text-muted font-medium truncate">Ev & Yaşam</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface-raised text-foreground text-lg font-bold shadow-xs hover:bg-border/40 transition cursor-pointer"
            aria-label="Menüyü aç/kapat"
          >
            {isOpen ? "✕" : "☰"}
          </button>
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

        {/* Mobile Profile Switcher inside Sidebar */}
        <div className="px-4 pt-3 pb-1 lg:hidden">
          <ProfileHeaderMenu variant="mobile" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5" aria-label="Ana Menü">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted/80">
              Uygulamalar
            </span>
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="text-[10px] font-bold text-muted hover:text-primary transition flex items-center gap-1 cursor-pointer hover:bg-surface-raised px-2 py-0.5 rounded-lg border border-transparent hover:border-border/60"
              title="Menü sıralamasını düzenle"
            >
              <span>⇅</span>
              <span>Sırala</span>
            </button>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate leading-tight">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
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
          {/* Notification Settings in Sidebar */}
          <NotificationBellButton variant="sidebar" />

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

      {/* Sidebar Customization Modal */}
      <SidebarOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderChanged={refreshNavItems}
      />
    </>
  );
}
