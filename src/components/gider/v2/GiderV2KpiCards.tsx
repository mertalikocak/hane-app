"use client";

import React from "react";
import { para } from "./constants";
import type { GiderV2Calculations } from "./types";

interface GiderV2KpiCardsProps {
  calc: GiderV2Calculations;
}

export function GiderV2KpiCards({ calc }: GiderV2KpiCardsProps) {
  const {
    ortakPay,
    kisiselToplam,
    mertGider,
    havsaGider,
    mertGelir,
    havsaGelir,
    mertKalan,
    havsaKalan,
    evGideriToplami,
    evKalan,
    kayitToplamlari,
    ayriBireyselHarcamalarToplami,
  } = calc;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. MERT KPI KARTI */}
      <div className="ds-card p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-600" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-xs">
                M
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Mert (Bu Ay)
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                mertKalan >= 0
                  ? "bg-success-soft text-success border-success/25"
                  : "bg-danger-soft text-danger border-danger/25"
              }`}
            >
              {mertKalan >= 0 ? "Kalan Bakiye" : "Açık (Ekside)"}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {para(mertKalan)}
            </span>
            <span className="block text-xs text-muted mt-0.5">
              Tüm gelir ve harcamalar sonrası net cep bakiyesi
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" /> Gelir:
            </span>
            <span className="font-bold text-success">{para(mertGelir)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger" /> Toplam Gider:
            </span>
            <span className="font-bold text-danger">{para(mertGider)}</span>
          </div>
          <div className="text-[11px] text-foreground-secondary flex items-center justify-between pt-1 pl-2 border-l-2 border-sky-500">
            <span>Ortak Pay: {para(ortakPay.mert)}</span>
            <span>Kişisel: {para(kisiselToplam.mert)}</span>
          </div>
        </div>
      </div>

      {/* 2. HAVSA KPI KARTI */}
      <div className="ds-card p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-pink-600" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center font-bold text-xs">
                H
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-700">
                Havsa (Bu Ay)
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                havsaKalan >= 0
                  ? "bg-success-soft text-success border-success/25"
                  : "bg-danger-soft text-danger border-danger/25"
              }`}
            >
              {havsaKalan >= 0 ? "Kalan Bakiye" : "Açık (Ekside)"}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {para(havsaKalan)}
            </span>
            <span className="block text-xs text-muted mt-0.5">
              Tüm gelir ve harcamalar sonrası net cep bakiyesi
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" /> Gelir:
            </span>
            <span className="font-bold text-success">{para(havsaGelir)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger" /> Toplam Gider:
            </span>
            <span className="font-bold text-danger">{para(havsaGider)}</span>
          </div>
          <div className="text-[11px] text-foreground-secondary flex items-center justify-between pt-1 pl-2 border-l-2 border-pink-500">
            <span>Ortak Pay: {para(ortakPay.havsa)}</span>
            <span>Kişisel: {para(kisiselToplam.havsa)}</span>
          </div>
        </div>
      </div>

      {/* 3. EV ORTAK HAVUZU KPI KARTI */}
      <div className="ds-card-lavender p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent border border-border-lavender text-primary flex items-center justify-center font-bold text-xs">
                🏠
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Ev Toplam Masrafı
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface text-primary border border-border-lavender">
              Ortak & Bireysel
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {para(evGideriToplami)}
            </span>
            <span className="block text-xs text-foreground-secondary mt-0.5">
              Hane kartları ve harcamaların toplam maliyeti
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border-lavender space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary">Kartlar & Harcamalar:</span>
            <span className="font-bold text-foreground">{para(kayitToplamlari)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary">Kişi Başı Yarı Pay:</span>
            <span className="font-bold text-primary">{para(kayitToplamlari / 2)}</span>
          </div>
          <div className="text-[11px] text-foreground-secondary flex items-center justify-between pt-1 pl-2 border-l-2 border-primary">
            <span>Ayrı Harcamalar: {para(ayriBireyselHarcamalarToplami)}</span>
            <span>Ev Net Havuzu: {para(evKalan)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
