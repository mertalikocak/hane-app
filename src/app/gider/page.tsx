"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EvGiderleriSayfasi } from "@/components/gider/EvGiderleriSayfasi";
import { TaksitSayfasi } from "@/components/gider/taksit/TaksitSayfasi";

type GiderTab = "butce" | "taksit";

function GiderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<GiderTab>(
    tabParam === "taksit" ? "taksit" : "butce"
  );

  useEffect(() => {
    if (tabParam === "taksit") {
      setActiveTab("taksit");
    } else {
      setActiveTab("butce");
    }
  }, [tabParam]);

  const handleTabChange = (newTab: GiderTab) => {
    setActiveTab(newTab);
    if (newTab === "taksit") {
      router.push("/gider?tab=taksit", { scroll: false });
    } else {
      router.push("/gider", { scroll: false });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-surface border border-border/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-primary uppercase tracking-wider mb-1">
            <span>💰</span> Hane Gider
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {activeTab === "butce" ? "Ev Giderleri & Aylık Bütçe" : "Kredi Kartı Taksit Takibi"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {activeTab === "butce"
              ? "Aylık ortak harcamaları, kredi kartı ekstrelerini ve gelir-gider dengesini yönetin."
              : "Taksitli alışverişlerinizi kartlarınıza göre takip edin, son ödeme tarihlerini hesaplayın."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1.5 rounded-2xl bg-surface-raised border border-border/70 shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange("butce")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "butce"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>📊</span>
            <span>Aylık Bütçe & Ekstre</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("taksit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "taksit"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>💳</span>
            <span>Taksit Takibi</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "butce" ? <EvGiderleriSayfasi /> : <TaksitSayfasi />}
    </div>
  );
}

export default function GiderPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface-raised" />}>
      <GiderContent />
    </Suspense>
  );
}
