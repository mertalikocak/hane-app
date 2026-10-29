"use client";

import React, { useState } from "react";
import { para, KULLANICI_ETIKET } from "./constants";
import type {
  BireyselAyriHarcama,
  BireyselGelirKalemi,
  KullaniciId,
} from "@/domain/haneGiderTypes";

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
      <div className="p-5 rounded-3xl bg-surface border border-border/80 shadow-xs space-y-4 self-start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🛍️</span>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Ayrı Bireysel Harcamalar ({harcamalar.length})
                </h3>
                <p className="text-[11px] text-muted">
                  Ortak paylaşıma girmeyen, tamamen kişinin kendisine ait kişisel harcamaları.
                </p>
              </div>
            </div>

            {/* Kişi Filtresi */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-raised border border-border text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setHarcamaFilter("all")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  harcamaFilter === "all" ? "bg-surface text-foreground font-black shadow-2xs" : "text-muted"
                }`}
              >
                Hepsi
              </button>
              <button
                type="button"
                onClick={() => setHarcamaFilter("mert")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  harcamaFilter === "mert" ? "bg-sky-500 text-white font-black shadow-2xs" : "text-muted"
                }`}
              >
                Mert
              </button>
              <button
                type="button"
                onClick={() => setHarcamaFilter("havsa")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  harcamaFilter === "havsa" ? "bg-pink-500 text-white font-black shadow-2xs" : "text-muted"
                }`}
              >
                Havsa
              </button>
            </div>
          </div>

          {/* Toplam Barlar */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/20 flex justify-between items-center">
              <span className="text-[11px] font-bold text-sky-400">Mert Toplam:</span>
              <span className="font-mono font-black text-foreground">{para(mertHarcamaTop)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-pink-500/5 border border-pink-500/20 flex justify-between items-center">
              <span className="text-[11px] font-bold text-pink-400">Havsa Toplam:</span>
              <span className="font-mono font-black text-foreground">{para(havsaHarcamaTop)}</span>
            </div>
          </div>

          {/* Liste */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {filteredHarcamalar.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs border border-dashed border-border/70 rounded-2xl">
                Henüz kayıtlı ayrı harcama yok.
              </div>
            ) : (
              filteredHarcamalar.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface-raised border border-border/70 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        h.kullaniciId === "mert"
                          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                          : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                      }`}
                    >
                      {KULLANICI_ETIKET[h.kullaniciId]}
                    </span>
                    <span className="font-bold text-foreground">{h.aciklama}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-foreground mr-1">
                      {para(h.tutar)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onHarcamaDuzenle(h)}
                      className="w-6 h-6 rounded-lg bg-surface border border-border/60 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer text-xs"
                      title="Düzenle"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => onHarcamaSil(h.id)}
                      className="w-6 h-6 rounded-lg bg-surface border border-border/60 flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-xs"
                      title="Sil"
                    >
                      ✕
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
          className="p-3 rounded-2xl bg-surface-raised border border-border/70 space-y-2 pt-2.5 mt-2"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
            Hızlı Bireysel Harcama Ekle
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <select
                value={harcamaKisi}
                onChange={(e) => setHarcamaKisi(e.target.value as KullaniciId)}
                className="w-full h-8 px-2 rounded-xl bg-surface border border-border text-xs font-bold text-foreground"
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
                className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                inputMode="decimal"
                value={harcamaTutarStr}
                onChange={(e) => setHarcamaTutarStr(e.target.value)}
                placeholder="Tutar (₺)"
                className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-black text-foreground font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full primary-button h-8 text-xs font-black shadow-xs cursor-pointer"
          >
            ➕ Harcamayı Ekle
          </button>
        </form>
      </div>

      {/* SAĞ: BİREYSEL GELİR KALEMLERİ */}
      <div className="p-5 rounded-3xl bg-surface border border-border/80 shadow-xs space-y-4 self-start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💼</span>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Bireysel Gelir Kalemleri ({gelirler.length})
                </h3>
                <p className="text-[11px] text-muted">
                  Maaş, prim, ikramiye vb. kişisel gelir girişleri (gider hesaplarını etkilemez).
                </p>
              </div>
            </div>

            {/* Kişi Filtresi */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-raised border border-border text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setGelirFilter("all")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  gelirFilter === "all" ? "bg-surface text-foreground font-black shadow-2xs" : "text-muted"
                }`}
              >
                Hepsi
              </button>
              <button
                type="button"
                onClick={() => setGelirFilter("mert")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  gelirFilter === "mert" ? "bg-sky-500 text-white font-black shadow-2xs" : "text-muted"
                }`}
              >
                Mert
              </button>
              <button
                type="button"
                onClick={() => setGelirFilter("havsa")}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  gelirFilter === "havsa" ? "bg-pink-500 text-white font-black shadow-2xs" : "text-muted"
                }`}
              >
                Havsa
              </button>
            </div>
          </div>

          {/* Toplam Barlar */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex justify-between items-center">
              <span className="text-[11px] font-bold text-emerald-400">Mert Gelir:</span>
              <span className="font-mono font-black text-foreground">{para(mertGelirTop)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex justify-between items-center">
              <span className="text-[11px] font-bold text-emerald-400">Havsa Gelir:</span>
              <span className="font-mono font-black text-foreground">{para(havsaGelirTop)}</span>
            </div>
          </div>

          {/* Liste */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {filteredGelirler.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs border border-dashed border-border/70 rounded-2xl">
                Henüz kayıtlı gelir bulunmuyor.
              </div>
            ) : (
              filteredGelirler.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface-raised border border-border/70 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        g.kullaniciId === "mert"
                          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                          : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                      }`}
                    >
                      {KULLANICI_ETIKET[g.kullaniciId]}
                    </span>
                    <span className="font-bold text-foreground">{g.aciklama}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-emerald-400 mr-1">
                      {para(g.tutar)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onGelirDuzenle(g)}
                      className="w-6 h-6 rounded-lg bg-surface border border-border/60 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer text-xs"
                      title="Düzenle"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => onGelirSil(g.id)}
                      className="w-6 h-6 rounded-lg bg-surface border border-border/60 flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-xs"
                      title="Sil"
                    >
                      ✕
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
          className="p-3 rounded-2xl bg-surface-raised border border-border/70 space-y-2 pt-2.5 mt-2"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
            Hızlı Gelir Ekle
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <select
                value={gelirKisi}
                onChange={(e) => setGelirKisi(e.target.value as KullaniciId)}
                className="w-full h-8 px-2 rounded-xl bg-surface border border-border text-xs font-bold text-foreground"
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
                className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                inputMode="decimal"
                value={gelirTutarStr}
                onChange={(e) => setGelirTutarStr(e.target.value)}
                placeholder="Tutar (₺)"
                className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-black text-foreground font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full primary-button h-8 text-xs font-black shadow-xs cursor-pointer"
          >
            ➕ Geliri Ekle
          </button>
        </form>
      </div>
    </div>
  );
}
