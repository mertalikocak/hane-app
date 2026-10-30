"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { AyarlarModal } from "./AyarlarModal";
import { getBulgular, BULGU_EVENT } from "@/storage/bulguStorage";
import { ProfileHeaderMenu } from "@/components/profile/ProfileHeaderMenu";
import { SidebarOrderModal } from "./SidebarOrderModal";
import { ThemeToggle } from "./ThemeToggle";
import {
  DEFAULT_NAV_ITEMS,
  getCustomSidebarOrder,
  getHiddenSidebarItems,
  getSortedNavItems,
  type NavItem,
} from "@/storage/sidebarStorage";
import {
  ModuleLucideIcon,
  SettingsIcon,
  ArrowUpDownIcon,
  MenuIcon,
  CloseIcon,
  PlusIcon,
} from "@/components/ui/Icons";
import { triggerQuickAction } from "@/components/quick-action/QuickActionLauncher";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"bulut" | "yedek" | "bildirim" | "bulgu">("bulgu");
  const [unresolvedBulguCount, setUnresolvedBulguCount] = useState(0);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);

  const refreshNavItems = () => {
    setNavItems(
      getSortedNavItems(
        DEFAULT_NAV_ITEMS,
        getCustomSidebarOrder(),
        getHiddenSidebarItems()
      )
    );
  };

  const refreshBulgular = () => {
    const list = getBulgular();
    setUnresolvedBulguCount(list.filter((b) => !b.cozuldu).length);
  };

  useEffect(() => {
    refreshNavItems();
    refreshBulgular();

    const handleOrderChange = () => refreshNavItems();
    const handleBulguChange = () => refreshBulgular();

    const handleOpenSettings = () => {
      setSettingsTab("bulgu");
      setIsSettingsOpen(true);
    };

    const handleOpenBulgu = () => {
      setSettingsTab("bulgu");
      setIsSettingsOpen(true);
    };

    const handleOpenOrder = () => {
      setIsOrderModalOpen(true);
    };

    window.addEventListener("hane_sidebar_order_changed", handleOrderChange);
    window.addEventListener(BULGU_EVENT, handleBulguChange);
    window.addEventListener("storage", handleOrderChange);
    window.addEventListener("storage", handleBulguChange);
    window.addEventListener("hane:open-ayarlar-modal", handleOpenSettings);
    window.addEventListener("hane:open-bulgu-modal", handleOpenBulgu);
    window.addEventListener("hane:open-sidebar-order", handleOpenOrder);

    return () => {
      window.removeEventListener("hane_sidebar_order_changed", handleOrderChange);
      window.removeEventListener(BULGU_EVENT, handleBulguChange);
      window.removeEventListener("storage", handleOrderChange);
      window.removeEventListener("storage", handleBulguChange);
      window.removeEventListener("hane:open-ayarlar-modal", handleOpenSettings);
      window.removeEventListener("hane:open-bulgu-modal", handleOpenBulgu);
      window.removeEventListener("hane:open-sidebar-order", handleOpenOrder);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/gider") return pathname === "/gider";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile & Tablet Top Header (< 1024px) */}
      <div className="lg:hidden sticky top-0 z-40 flex flex-col border-b border-border bg-surface/95 backdrop-blur-md">
        <div style={{ height: "env(safe-area-inset-top, 0px)" }} className="w-full shrink-0" />
        <div className="flex h-15 items-center justify-between px-4 sm:px-6 gap-2">
          <Link href="/" className="flex items-center gap-2.5 text-foreground min-w-0">
            <img
              src="/logo.png"
              alt="Hane App Logo"
              className="h-8 w-8 shrink-0 rounded-[10px] object-cover border border-border"
            />
            <div className="flex flex-col min-w-0">
              <span className="leading-none text-sm font-semibold tracking-tight text-foreground truncate">
                Hane App
              </span>
              <span className="text-[11px] text-muted font-medium truncate mt-0.5">
                Ev & Yaşam Yönetimi
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle variant="mobile" />
            <ProfileHeaderMenu variant="mobile" />

            <button
              type="button"
              onClick={() => triggerQuickAction("shopping")}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border-lavender bg-accent px-2.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover transition-colors duration-150 cursor-pointer"
              title="Hızlı Ekle"
              aria-label="Hızlı Ekle"
            >
              <PlusIcon className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Hızlı Ekle</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
              aria-label="Menüyü aç/kapat"
            >
              {isOpen ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#30263A]/45 backdrop-blur-[2px] lg:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* App Logo & Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5 shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 group min-w-0"
          >
            <img
              src="/logo.png"
              alt="Hane App Logo"
              className="h-9 w-9 shrink-0 rounded-[10px] object-cover border border-border"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-base font-semibold tracking-tight text-foreground leading-tight">
                Hane App
              </span>
              <span className="text-[11px] text-muted font-medium truncate">
                Ev Yönetim Sistemi
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden icon-button h-8 w-8"
            aria-label="Menüyü kapat"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Ana Menü">
          <div className="flex items-center justify-between px-2.5 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Modüller
            </span>
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-background hover:text-foreground transition-colors duration-150 cursor-pointer"
              title="Menü sıralamasını düzenle"
            >
              <ArrowUpDownIcon className="h-3 w-3" />
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
                  className={`group flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors duration-150 ${
                    active
                      ? "bg-accent text-foreground font-semibold border border-border-lavender"
                      : "text-foreground-secondary hover:bg-background hover:text-foreground border border-transparent"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                      active
                        ? "bg-primary text-white"
                        : "bg-background text-foreground-secondary group-hover:bg-surface group-hover:text-primary border border-border"
                    }`}
                  >
                    <ModuleLucideIcon href={item.href} className="h-4 w-4" />
                  </span>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm truncate leading-tight">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-surface text-primary border border-border-lavender">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted truncate mt-0.5 font-normal">
                      {item.description}
                    </span>
                  </div>

                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </Link>

                {/* Sub items if active */}
                {item.subItems && active && (
                  <div className="ml-7 pl-3 border-l border-border-lavender space-y-1 py-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex min-h-[34px] items-center rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-150 ${
                          pathname === sub.href
                            ? "text-primary font-semibold bg-surface-lavender"
                            : "text-muted hover:text-foreground hover:bg-background"
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

        {/* Footer actions */}
        <div className="border-t border-border p-3 space-y-2">
          <ThemeToggle variant="sidebar" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSettingsTab("bulgu");
              setIsSettingsOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-background hover:bg-accent/60 border border-border text-foreground transition-colors duration-150 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-border text-primary">
                <SettingsIcon className="h-4 w-4" />
              </span>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">
                  Uygulama Ayarları
                </span>
                <span className="text-[11px] text-muted truncate">
                  Bulut, Yedek, Bildirim, Notlar
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {unresolvedBulguCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-accent text-foreground border border-border-lavender">
                  {unresolvedBulguCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </aside>

      {/* Universal Ayarlar Modal */}
      <AyarlarModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />

      {/* Sidebar Customization Modal */}
      <SidebarOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderChanged={refreshNavItems}
      />
    </>
  );
}
