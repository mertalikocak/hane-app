"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EvGiderleriSayfasiV2 } from "@/components/gider/v2/EvGiderleriSayfasiV2";
import { TaksitSayfasi } from "@/components/gider/taksit/TaksitSayfasi";
import { PageHeader } from "@/components/ui/PageHeader";
import { WalletIcon } from "@/components/ui/Icons";

type GiderTab = "butce" | "taksit";

function GiderEskiContent() {
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
      router.push("/gider-eski?tab=taksit", { scroll: false });
    } else {
      router.push("/gider-eski", { scroll: false });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        badge="Hane Gider (Eski Yedek)"
        icon={<WalletIcon className="h-3.5 w-3.5" />}
        title={activeTab === "butce" ? "Ev Giderleri & Aylık Bütçe (Eski)" : "Kredi Kartı Taksit Takibi (Eski)"}
        subtitle={
          activeTab === "butce"
            ? "Aylık ortak harcamaları, kredi kartı ekstrelerini ve gelir-gider dengesini yönetin."
            : "Taksitli alışverişlerinizi kartlarınıza göre takip edin, son ödeme tarihlerini hesaplayın."
        }
        actions={
          <div className="inline-flex items-center rounded-xl border border-border bg-surface p-1 shadow-xs">
            <button
              type="button"
              onClick={() => handleTabChange("butce")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "butce"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <span>📊</span>
              <span>Aylık Bütçe & Ekstre</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("taksit")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "taksit"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <span>💳</span>
              <span>Taksit Takibi</span>
            </button>
          </div>
        }
      />

      {/* Tab Contents */}
      {activeTab === "butce" ? <EvGiderleriSayfasiV2 /> : <TaksitSayfasi />}
    </div>
  );
}

export default function GiderEskiPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-raised border border-border" />}>
      <GiderEskiContent />
    </Suspense>
  );
}

