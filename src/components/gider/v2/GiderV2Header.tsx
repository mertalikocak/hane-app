"use client";

import React, { useState, useRef, useEffect } from "react";
import { AYLAR } from "./constants";
import type { GiderV2ViewMode } from "./types";
import { ayAnahtariParcala, ayAnahtariOlustur } from "@/storage/ayDeposu";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

interface GiderV2HeaderProps {
  anahtar: string;
  onAnahtarDegis: (yeni: string) => void;
  activeView: GiderV2ViewMode;
  onViewChange: (view: GiderV2ViewMode) => void;
  onYeniKayitClick: () => void;
  onOncekiAyGiderleriKopyala: () => void;
  onOncekiAyGelirleriKopyala: () => void;
  onSifirla: () => void;
  onOzetModalAc: () => void;
  onDisaAktar: () => void;
  onIceAktarClick: () => void;
  kartSayisi: number;
  denetimKalemSayisi: number;
  bireyselSayisi: number;
}

function simdikiAyAnahtari(): string {
  const d = new Date();
  return ayAnahtariOlustur(d.getFullYear(), d.getMonth());
}

function ayEtiketi(anahtar: string): string {
  const { yil, ay } = ayAnahtariParcala(anahtar);
  return `${AYLAR[ay] ?? "—"} ${yil}`;
}

function ayKaydir(anahtar: string, delta: number): string {
  const { yil, ay } = ayAnahtariParcala(anahtar);
  const d = new Date(yil, ay + delta, 1);
  return ayAnahtariOlustur(d.getFullYear(), d.getMonth());
}

export function GiderV2Header({
  anahtar,
  onAnahtarDegis,
  activeView,
  onViewChange,
  onYeniKayitClick,
  onOncekiAyGiderleriKopyala,
  onOncekiAyGelirleriKopyala,
  onSifirla,
  onOzetModalAc,
  onDisaAktar,
  onIceAktarClick,
  kartSayisi,
  denetimKalemSayisi,
  bireyselSayisi,
}: GiderV2HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCurrentMonth = anahtar === simdikiAyAnahtari();

  return (
    <div className="space-y-4">
      {/* Üst Bar: Dönem Gezgini, İşlemler ve Hızlı Ekle */}
      <div className="ds-card flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
        {/* Sol: Ay Seçici */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-xl bg-surface-raised border border-border">
            <button
              type="button"
              onClick={() => onAnahtarDegis(ayKaydir(anahtar, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground hover:bg-surface transition cursor-pointer"
              title="Önceki ay"
              aria-label="Önceki ay"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="px-3.5 py-1 text-xs sm:text-sm font-bold text-foreground min-w-[130px] text-center flex items-center justify-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span>{ayEtiketi(anahtar)}</span>
            </div>
            <button
              type="button"
              onClick={() => onAnahtarDegis(ayKaydir(anahtar, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground hover:bg-surface transition cursor-pointer"
              title="Sonraki ay"
              aria-label="Sonraki ay"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => onAnahtarDegis(simdikiAyAnahtari())}
              className="accent-button h-9 px-3 text-xs"
            >
              Bu Aya Git
            </button>
          )}
        </div>

        {/* Sağ: Eylem Butonları */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Diğer İşlemler Açılır Menüsü */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="secondary-button h-10 px-3 text-xs"
              title="Ay ayarları, kopyalama ve yedekleme"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">İşlemler</span>
              <span className="text-[10px] text-muted">▾</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-surface border border-border shadow-lg z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-xs font-medium space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOncekiAyGiderleriKopyala();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span className="text-base">💳</span>
                  <div>
                    <div className="font-bold">Önceki Aydan Giderleri Kopyala</div>
                    <div className="text-[10px] text-muted">Kartlar ve harcamaları aktarır</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOncekiAyGelirleriKopyala();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span className="text-base">💵</span>
                  <div>
                    <div className="font-bold">Önceki Aydan Gelirleri Kopyala</div>
                    <div className="text-[10px] text-muted">Bireysel gelirleri aktarır</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOzetModalAc();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span className="text-base">📋</span>
                  <div>
                    <div className="font-bold">WhatsApp / Pano Özeti</div>
                    <div className="text-[10px] text-muted">Tek metin olarak kopyala</div>
                  </div>
                </button>

                <div className="my-1 border-t border-border" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDisaAktar();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span className="text-base">📤</span>
                  <div>
                    <div className="font-bold">JSON Yedeği İndir</div>
                    <div className="text-[10px] text-muted">Tüm ayları dosyaya kaydet</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onIceAktarClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span className="text-base">📥</span>
                  <div>
                    <div className="font-bold">JSON Yedeği Yükle</div>
                    <div className="text-[10px] text-muted">Yedekten geri yükle</div>
                  </div>
                </button>

                <div className="my-1 border-t border-border" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSifirla();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-danger hover:bg-danger-soft transition text-left cursor-pointer"
                >
                  <span className="text-base">🗑️</span>
                  <div>
                    <div className="font-bold">Bu Ayı Sıfırla</div>
                    <div className="text-[10px] opacity-80">Tüm kalemleri temizle</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Ana Ekle Butonu */}
          <button
            type="button"
            onClick={onYeniKayitClick}
            className="primary-button h-10 px-4 text-xs"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Yeni Harcama / Kart Ekle</span>
          </button>
        </div>
      </div>

      {/* Görünüm Sekmeleri (Navigasyon): 4 Temiz Mod */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-surface border border-border overflow-x-auto scrollbar-none shadow-2xs">
        <button
          type="button"
          onClick={() => onViewChange("ozet")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeView === "ozet"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground-secondary hover:text-foreground hover:bg-surface-raised"
          }`}
        >
          <span>📊</span>
          <span>Genel Bakış & Havale / Mahsuplaşma</span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("kartlar")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeView === "kartlar"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground-secondary hover:text-foreground hover:bg-surface-raised"
          }`}
        >
          <span>💳</span>
          <span>Kartlar & Harcamalar</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
              activeView === "kartlar"
                ? "bg-white/20 text-white"
                : "bg-surface-raised text-muted"
            }`}
          >
            {kartSayisi}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("denetim")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeView === "denetim"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground-secondary hover:text-foreground hover:bg-surface-raised"
          }`}
        >
          <span>🔍</span>
          <span>Hesap İnceleme & Denetim</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
              activeView === "denetim"
                ? "bg-white/20 text-white"
                : "bg-surface-raised text-muted"
            }`}
          >
            {denetimKalemSayisi}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("bireysel_gelir")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeView === "bireysel_gelir"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground-secondary hover:text-foreground hover:bg-surface-raised"
          }`}
        >
          <span>🛍️</span>
          <span>Bireysel Harcama & Gelirler</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
              activeView === "bireysel_gelir"
                ? "bg-white/20 text-white"
                : "bg-surface-raised text-muted"
            }`}
          >
            {bireyselSayisi}
          </span>
        </button>
      </div>
    </div>
  );
}
