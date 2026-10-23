"use client";

import React from "react";
import { para } from "./constants";
import type { GiderV2Calculations } from "./types";

interface GiderV2KpiCardsProps {
  calc: GiderV2Calculations;
}

export function GiderV2KpiCards({ calc }: GiderV2KpiCardsProps) {
  const {
    genel,
    ayriBireyselToplam,
    mertGider,
    havsaGider,
    mertGelir,
    havsaGelir,
    mertKalan,
    havsaKalan,
    evGideriToplami,
    evGelirToplami,
    evKalan,
    kayitToplamlari,
    ayriBireyselHarcamalarToplami,
  } = calc;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. MERT KPI KARTI */}
      <div className="p-5 rounded-3xl bg-surface border border-sky-500/25 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-sky-500/40 transition">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-600" />
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-black text-xs">
                M
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                Mert (Bu Ay)
              </span>
            </div>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                mertKalan >= 0
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {mertKalan >= 0 ? "Kalan Bakiye" : "Açık (Ekside)"}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {para(mertKalan)}
            </span>
            <span className="block text-[11px] text-muted mt-0.5">
              Tüm gelir ve harcamalar sonrası net cep bakiyesi
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Gelir:
            </span>
            <span className="font-bold text-emerald-400">{para(mertGelir)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Toplam Gider:
            </span>
            <span className="font-bold text-rose-400">{para(mertGider)}</span>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1 pl-2 border-l-2 border-sky-500/40">
            <span>Ortak Pay: {para(genel.mert)}</span>
            <span>Kişisel: {para(ayriBireyselToplam.mert)}</span>
          </div>
        </div>
      </div>

      {/* 2. HAVSA KPI KARTI */}
      <div className="p-5 rounded-3xl bg-surface border border-pink-500/25 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-pink-500/40 transition">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-pink-600" />
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center font-black text-xs">
                H
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-pink-400">
                Havsa (Bu Ay)
              </span>
            </div>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                havsaKalan >= 0
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {havsaKalan >= 0 ? "Kalan Bakiye" : "Açık (Ekside)"}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {para(havsaKalan)}
            </span>
            <span className="block text-[11px] text-muted mt-0.5">
              Tüm gelir ve harcamalar sonrası net cep bakiyesi
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Gelir:
            </span>
            <span className="font-bold text-emerald-400">{para(havsaGelir)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Toplam Gider:
            </span>
            <span className="font-bold text-rose-400">{para(havsaGider)}</span>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1 pl-2 border-l-2 border-pink-500/40">
            <span>Ortak Pay: {para(genel.havsa)}</span>
            <span>Kişisel: {para(ayriBireyselToplam.havsa)}</span>
          </div>
        </div>
      </div>

      {/* 3. EV ORTAK HAVUZU KPI KARTI */}
      <div className="p-5 rounded-3xl bg-surface border border-purple-500/25 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-indigo-600" />
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black text-xs">
                🏠
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                Ev Toplam Masrafı
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Ortak & Bireysel
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {para(evGideriToplami)}
            </span>
            <span className="block text-[11px] text-muted mt-0.5">
              Hane kartları ve harcamaların toplam maliyeti
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Ortak Kartlar & Harcamalar:</span>
            <span className="font-bold text-foreground">{para(kayitToplamlari)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Kişi Başı Yarı Pay:</span>
            <span className="font-bold text-purple-400">{para(kayitToplamlari / 2)}</span>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1 pl-2 border-l-2 border-purple-500/40">
            <span>Ayrı Harcamalar: {para(ayriBireyselHarcamalarToplami)}</span>
            <span>Ev Net Havuzu: {para(evKalan)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
