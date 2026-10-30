"use client";

import React, { useState } from "react";
import { para, KULLANICI_ETIKET } from "./constants";
import type {
  BireyselAyriHarcama,
  BireyselGelirKalemi,
  KullaniciId,
} from "@/domain/haneGiderTypes";
import { PlusIcon, EditIcon, CloseIcon } from "@/components/ui/Icons";

interface GiderV2BireyselGelirSectionProps {
  harcamalar: BireyselAyriHarcama[];
  gelirler: BireyselGelirKalemi[];
  onHarcamaEkle: (h: Omit<BireyselAyriHarcama, "id">) => void;
  onHarcamaDuzenle: (h: BireyselAyriHarcama) => void;
  onHarcamaSil: (id: string) => void;
  onGelirEkle: (g: Omit<BireyselGelirKalemi, "id">) => void;
  onGelirDuzenle: (g: BireyselGelirKalemi) => void;
  onGelirSil: (id: string) => void;
}

export function GiderV2BireyselGelirSection({
  harcamalar,
  gelirler,
  onHarcamaEkle,
  onHarcamaDuzenle,
  onHarcamaSil,
  onGelirEkle,
  onGelirDuzenle,
  onGelirSil,
}: GiderV2BireyselGelirSectionProps) {
  // Harcama Form State
  const [harcamaKisi, setHarcamaKisi] = useState<KullaniciId>("mert");
  const [harcamaAciklama, setHarcamaAciklama] = useState("");
  const [harcamaTutarStr, setHarcamaTutarStr] = useState("");
  const [harcamaFilter, setHarcamaFilter] = useState<"all" | "mert" | "havsa">("all");

  // Gelir Form State
  const [gelirKisi, setGelirKisi] = useState<KullaniciId>("mert");
  const [gelirAciklama, setGelirAciklama] = useState("");
  const [gelirTutarStr, setGelirTutarStr] = useState("");
  const [gelirFilter, setGelirFilter] = useState<"all" | "mert" | "havsa">("all");

  const handleHarcamaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = Number(harcamaTutarStr.replace(",", "."));
    if (!harcamaAciklama.trim() || !Number.isFinite(tutar) || tutar <= 0) return;

    onHarcamaEkle({
      kullaniciId: harcamaKisi,
      aciklama: harcamaAciklama.trim(),
      tutar,
    });

    setHarcamaAciklama("");
    setHarcamaTutarStr("");
  };

  const handleGelirSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = Number(gelirTutarStr.replace(",", "."));
    if (!gelirAciklama.trim() || !Number.isFinite(tutar) || tutar <= 0) return;

    onGelirEkle({
      kullaniciId: gelirKisi,
      aciklama: gelirAciklama.trim(),
      tutar,
    });

    setGelirAciklama("");
    setGelirTutarStr("");
  };

  const filteredHarcamalar = harcamalar.filter(
    (h) => harcamaFilter === "all" || h.kullaniciId === harcamaFilter
  );

  const filteredGelirler = gelirler.filter(
    (g) => gelirFilter === "all" || g.kullaniciId === gelirFilter
  );

  const mertHarcamaTop = harcamalar
    .filter((h) => h.kullaniciId === "mert")
    .reduce((s, h) => s + h.tutar, 0);
  const havsaHarcamaTop = harcamalar
    .filter((h) => h.kullaniciId === "havsa")
    .reduce((s, h) => s + h.tutar, 0);

  const mertGelirTop = gelirler
    .filter((g) => g.kullaniciId === "mert")
    .reduce((s, g) => s + g.tutar, 0);
  const havsaGelirTop = gelirler
    .filter((g) => g.kullaniciId === "havsa")
    .reduce((s, g) => s + g.tutar, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-150 items-start">
      {/* SOL: BİREYSEL AYRI HARCAMALAR */}
      <div className="ds-card p-5 space-y-4 self-start">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🛍️</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Ayrı Bireysel Harcamalar ({harcamalar.length})
                </h3>
                <p className="text-[11px] text-muted">
                  Ortak paylaşıma girmeyen, tamamen kişinin kendisine ait kişisel harcamaları.
                </p>
              </div>
            </div>

            {/* Kişi Filtresi */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-border text-[11px] font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setHarcamaFilter("all")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  harcamaFilter === "all" ? "bg-surface text-foreground font-bold shadow-2xs" : "text-muted"
                }`}
              >
                Hepsi
              </button>
              <button
                type="button"
                onClick={() => setHarcamaFilter("mert")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  harcamaFilter === "mert" ? "bg-sky-600 text-white font-bold shadow-2xs" : "text-muted"
                }`}
              >
                Mert
              </button>
              <button
                type="button"
                onClick={() => setHarcamaFilter("havsa")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  harcamaFilter === "havsa" ? "bg-pink-600 text-white font-bold shadow-2xs" : "text-muted"
                }`}
              >
                Havsa
              </button>
            </div>
          </div>

          {/* Toplam Barlar */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 flex justify-between items-center">
              <span className="text-[11px] font-bold text-sky-700">Mert Toplam:</span>
              <span className="font-mono font-bold text-foreground">{para(mertHarcamaTop)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-pink-50/70 border border-pink-200 flex justify-between items-center">
              <span className="text-[11px] font-bold text-pink-700">Havsa Toplam:</span>
              <span className="font-mono font-bold text-foreground">{para(havsaHarcamaTop)}</span>
            </div>
          </div>

          {/* Liste */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {filteredHarcamalar.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs border border-dashed border-border rounded-xl bg-surface-raised/50">
                Henüz kayıtlı ayrı harcama yok.
              </div>
            ) : (
              filteredHarcamalar.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-raised border border-border text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        h.kullaniciId === "mert"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-pink-50 text-pink-700 border-pink-200"
                      }`}
                    >
                      {KULLANICI_ETIKET[h.kullaniciId]}
                    </span>
                    <span className="font-semibold text-foreground truncate">{h.aciklama}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-foreground mr-1">
                      {para(h.tutar)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onHarcamaDuzenle(h)}
                      className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground transition cursor-pointer"
                      title="Düzenle"
                    >
                      <EditIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onHarcamaSil(h.id)}
                      className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                      title="Sil"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ekleme Formu */}
        <form
          onSubmit={handleHarcamaSubmit}
          className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-2.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
            Hızlı Bireysel Harcama Ekle
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <select
                value={harcamaKisi}
                onChange={(e) => setHarcamaKisi(e.target.value as KullaniciId)}
                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground"
              >
                <option value="mert">Kişi: Mert</option>
                <option value="havsa">Kişi: Havsa</option>
              </select>
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                value={harcamaAciklama}
                onChange={(e) => setHarcamaAciklama(e.target.value)}
                placeholder="Örn: Kişisel Kıyafet"
                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                inputMode="decimal"
                value={harcamaTutarStr}
                onChange={(e) => setHarcamaTutarStr(e.target.value)}
                placeholder="Tutar (₺)"
                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-bold text-foreground font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="primary-button w-full h-9 text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Harcamayı Ekle</span>
          </button>
        </form>
      </div>

      {/* SAĞ: BİREYSEL GELİR KALEMLERİ */}
      <div className="ds-card p-5 space-y-4 self-start">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💼</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Bireysel Gelir Kalemleri ({gelirler.length})
                </h3>
                <p className="text-[11px] text-muted">
                  Maaş, prim, ikramiye vb. kişisel gelir girişleri (gider hesaplarını etkilemez).
                </p>
              </div>
            </div>

            {/* Kişi Filtresi */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised border border-border text-[11px] font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setGelirFilter("all")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  gelirFilter === "all" ? "bg-surface text-foreground font-bold shadow-2xs" : "text-muted"
                }`}
              >
                Hepsi
              </button>
              <button
                type="button"
                onClick={() => setGelirFilter("mert")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  gelirFilter === "mert" ? "bg-sky-600 text-white font-bold shadow-2xs" : "text-muted"
                }`}
              >
                Mert
              </button>
              <button
                type="button"
                onClick={() => setGelirFilter("havsa")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  gelirFilter === "havsa" ? "bg-pink-600 text-white font-bold shadow-2xs" : "text-muted"
                }`}
              >
                Havsa
              </button>
            </div>
          </div>

          {/* Toplam Barlar */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-success-soft/60 border border-success/25 flex justify-between items-center">
              <span className="text-[11px] font-bold text-success">Mert Gelir:</span>
              <span className="font-mono font-bold text-foreground">{para(mertGelirTop)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-success-soft/60 border border-success/25 flex justify-between items-center">
              <span className="text-[11px] font-bold text-success">Havsa Gelir:</span>
              <span className="font-mono font-bold text-foreground">{para(havsaGelirTop)}</span>
            </div>
          </div>

          {/* Liste */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {filteredGelirler.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs border border-dashed border-border rounded-xl bg-surface-raised/50">
                Henüz kayıtlı gelir bulunmuyor.
              </div>
            ) : (
              filteredGelirler.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-raised border border-border text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        g.kullaniciId === "mert"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-pink-50 text-pink-700 border-pink-200"
                      }`}
                    >
                      {KULLANICI_ETIKET[g.kullaniciId]}
                    </span>
                    <span className="font-semibold text-foreground truncate">{g.aciklama}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-success mr-1">
                      {para(g.tutar)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onGelirDuzenle(g)}
                      className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground transition cursor-pointer"
                      title="Düzenle"
                    >
                      <EditIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onGelirSil(g.id)}
                      className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                      title="Sil"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ekleme Formu */}
        <form
          onSubmit={handleGelirSubmit}
          className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-2.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
            Hızlı Gelir Ekle
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <select
                value={gelirKisi}
                onChange={(e) => setGelirKisi(e.target.value as KullaniciId)}
                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground"
              >
                <option value="mert">Kişi: Mert</option>
                <option value="havsa">Kişi: Havsa</option>
              </select>
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                value={gelirAciklama}
                onChange={(e) => setGelirAciklama(e.target.value)}
                placeholder="Örn: Aylık Maaş / Prim"
                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                inputMode="decimal"
                value={gelirTutarStr}
                onChange={(e) => setGelirTutarStr(e.target.value)}
                placeholder="Tutar (₺)"
                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-bold text-foreground font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="primary-button w-full h-9 text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Geliri Ekle</span>
          </button>
        </form>
      </div>
    </div>
  );
}
