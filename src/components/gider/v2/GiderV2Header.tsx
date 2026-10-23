"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AYLAR } from "./constants";
import type { GiderV2ViewMode } from "./types";
import { ayAnahtariParcala, ayAnahtariOlustur } from "@/storage/ayDeposu";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs">
        {/* Sol: Ay Seçici */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-2xl bg-surface-raised border border-border/70 shadow-2xs">
            <button
              type="button"
              onClick={() => onAnahtarDegis(ayKaydir(anahtar, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-base font-black text-muted hover:text-foreground hover:bg-surface transition cursor-pointer"
              title="Önceki ay"
              aria-label="Önceki ay"
            >
              ‹
            </button>
            <div className="px-3.5 py-1 text-xs sm:text-sm font-black text-foreground min-w-[130px] text-center flex items-center justify-center gap-2">
              <span className="text-primary text-sm">📅</span>
              <span>{ayEtiketi(anahtar)}</span>
            </div>
            <button
              type="button"
              onClick={() => onAnahtarDegis(ayKaydir(anahtar, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-base font-black text-muted hover:text-foreground hover:bg-surface transition cursor-pointer"
              title="Sonraki ay"
              aria-label="Sonraki ay"
            >
              ›
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => onAnahtarDegis(simdikiAyAnahtari())}
              className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-xs font-bold text-primary hover:bg-primary/20 transition cursor-pointer"
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
              className="secondary-button h-10 px-3 text-xs font-bold gap-1.5 cursor-pointer"
              title="Ay ayarları, kopyalama ve yedekleme"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">İşlemler</span>
              <span className="text-[10px] text-muted">▾</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-surface border border-border shadow-xl z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-xs font-medium space-y-1">
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

                <div className="my-1 border-t border-border/70" />

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

                <div className="my-1 border-t border-border/70" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSifirla();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition text-left cursor-pointer"
                >
                  <span className="text-base">🗑️</span>
                  <div>
                    <div className="font-bold">Bu Ayı Sıfırla</div>
                    <div className="text-[10px] text-rose-400">Tüm kalemleri temizle</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Eski Hane Gider'e Dönüş Linki */}
          <Link
            href="/gider"
            className="secondary-button h-10 px-3 text-xs font-bold text-muted hover:text-foreground hidden lg:inline-flex items-center gap-1.5"
            title="Eski Hane Gider sayfasına geçiş yap"
          >
            <span>🔙</span>
            <span>Eski Sürüme Git</span>
          </Link>

          {/* Ana Ekle Butonu */}
          <button
            type="button"
            onClick={onYeniKayitClick}
            className="primary-button h-10 px-4 text-xs font-black shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Yeni Harcama / Kart Ekle</span>
          </button>
        </div>
      </div>

      {/* Görünüm Sekmeleri (Navigasyon): 4 Temiz Mod */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-raised border border-border/70 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => onViewChange("ozet")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer shrink-0 ${
            activeView === "ozet"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface/50"
          }`}
        >
          <span>📊</span>
          <span>Genel Bakış & Havale / Mahsuplaşma</span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("kartlar")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer shrink-0 ${
            activeView === "kartlar"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface/50"
          }`}
        >
          <span>💳</span>
          <span>Ortak Kartlar & Harcamalar</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-black/20 font-mono">
            {kartSayisi}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("denetim")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer shrink-0 ${
            activeView === "denetim"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface/50"
          }`}
        >
          <span>🔍</span>
          <span>Hesap İnceleme & Denetim</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-mono">
            {denetimKalemSayisi}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onViewChange("bireysel_gelir")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer shrink-0 ${
            activeView === "bireysel_gelir"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface/50"
          }`}
        >
          <span>🛍️</span>
          <span>Bireysel Harcama & Gelirler</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-black/20 font-mono">
            {bireyselSayisi}
          </span>
        </button>
      </div>
    </div>
  );
}
