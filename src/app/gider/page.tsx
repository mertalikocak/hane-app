"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HaneGiderSimpleView } from "@/components/gider/simple/HaneGiderSimpleView";
import { TaksitSimpleView } from "@/components/gider/simple/TaksitSimpleView";
import { PageHeader } from "@/components/ui/PageHeader";
import { WalletIcon } from "@/components/ui/Icons";

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
    <div className="space-y-5 pb-12">
      <PageHeader
        badge="Hane Gider"
        icon={<WalletIcon className="h-3.5 w-3.5" />}
        title={activeTab === "butce" ? "Ev Giderleri & Aylık Bütçe" : "Kredi Kartı Taksit Takibi"}
        subtitle={
          activeTab === "butce"
            ? "Tek ekranda tüm kartlar, harcamalar ve ay sonu mahsuplaşma hesabı."
            : "Taksitlerinizi ve kalan vadelerinizi tek bakışta takip edin."
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
              <span>Aylık Gider & Mahsuplaşma</span>
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
              <span>Taksitler</span>
            </button>
          </div>
        }
      />

      {activeTab === "butce" ? <HaneGiderSimpleView /> : <TaksitSimpleView />}
    </div>
  );
}

export default function GiderPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-raised border border-border" />}>
      <GiderContent />
    </Suspense>
  );
}
