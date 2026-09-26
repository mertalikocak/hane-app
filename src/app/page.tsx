"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentWeekStart } from "@/lib/date/week";
import { STORAGE_KEYS, type LocalMeal, type LocalPlanEntry } from "@/lib/local-storage/store";
import { ayAnahtariOlustur, ayVerisiOku } from "@/storage/ayDeposu";
import { ayToplamGirisGideri, ayToplamGelir } from "@/domain/ekstreHesapla";
import { getProfiles, getActiveProfileId, getProfileStats } from "@/storage/bodyStorage";

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

export default function DashboardPage() {
  const [cardoStats, setCardoStats] = useState({ count: 0, total: 0, remaining: 0 });
  const [dinnerStats, setDinnerStats] = useState({ mealCount: 0, plannedDays: 0 });
  const [giderStats, setGiderStats] = useState({ totalExpense: 0, totalIncome: 0 });
  const [fitStats, setFitStats] = useState<{
    profileName: string;
    latestWeight?: number;
    latestBodyFat?: number;
    totalMeasurements: number;
  }>({ profileName: "", totalMeasurements: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      // 1. CarDo Stats
      const carData = localStorage.getItem("carExpenses");
      if (carData) {
        const parsed = JSON.parse(carData);
        const count = parsed.length;
        const total = parsed.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
        const remaining = parsed
          .filter((item: { completed: boolean }) => !item.completed)
          .reduce((sum: number, item: { price: number }) => sum + item.price, 0);
        setCardoStats({ count, total, remaining });
      }

      // 2. Dinner Stats
      const mealsData = localStorage.getItem(STORAGE_KEYS.meals);
      const plansData = localStorage.getItem(STORAGE_KEYS.plans);
      const meals: LocalMeal[] = mealsData ? JSON.parse(mealsData) : [];
      const plans: Record<string, LocalPlanEntry[]> = plansData ? JSON.parse(plansData) : {};
      const currentWeek = getCurrentWeekStart();
      const currentAssignments = plans[currentWeek] ?? [];
      const plannedDays = new Set(currentAssignments.map((a) => a.dayOfWeek)).size;
      setDinnerStats({ mealCount: meals.length, plannedDays });

      // 3. Gider Stats
      const now = new Date();
      const ayAnahtar = ayAnahtariOlustur(now.getFullYear(), now.getMonth());
      const ayVeri = ayVerisiOku(ayAnahtar);
      const totalExpense = ayToplamGirisGideri(ayVeri);
      const totalIncome = ayToplamGelir(ayVeri);
      setGiderStats({ totalExpense, totalIncome });

      // 4. Fit Stats
      const profiles = getProfiles();
      const activeId = getActiveProfileId();
      const activeProfile = profiles.find((p) => p.id === activeId) || profiles[0];
      if (activeProfile) {
        const st = getProfileStats(activeProfile.id);
        setFitStats({
          profileName: `${activeProfile.firstName}`,
          latestWeight: st.latestWeight,
          latestBodyFat: st.latestBodyFat,
          totalMeasurements: st.totalMeasurements,
        });
      }
    } catch (e) {
      console.error("Dashboard loading error", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const todayFormatted = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-600 to-red-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
            <span>📅</span> {todayFormatted}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Hoş Geldiniz, Hane Yönetim Paneli
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/90 font-medium">
            Araç masrafları, haftalık akşam yemekleri, ev bütçesi ve vücut takibi tek çatı altında.
          </p>
        </div>
        {/* Decorative background circles */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 h-48 w-48 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />
      </section>

      {/* Grid of 4 Main Apps */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: CarDo */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all group">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl group-hover:scale-110 transition-transform">
                🚗
              </span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                {isLoaded ? `${cardoStats.count} Masraf` : "..."}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">CarDo</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Araç bakım, yakıt, sigorta ve periyodik masrafların takibi.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Toplam Masraf:</span>
                <span className="font-bold text-foreground">
                  {isLoaded ? para(cardoStats.total) : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Ödenmeyi Bekleyen:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {isLoaded ? para(cardoStats.remaining) : "..."}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/cardolist"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <span>Masrafları Yönet</span>
            <span>→</span>
          </Link>
        </div>

        {/* Card 2: Hane Dinner */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-md hover:border-orange-500/40 transition-all group">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl group-hover:scale-110 transition-transform">
                🍽️
              </span>
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                {isLoaded ? `${dinnerStats.plannedDays} / 7 Gün` : "..."}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Hane Dinner</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Haftalık akşam yemeği planı, tarif kataloğu ve otomatik market listesi.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Kayıtlı Tarif:</span>
                <span className="font-bold text-foreground">
                  {isLoaded ? `${dinnerStats.mealCount} Tarif` : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Bu Hafta:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {isLoaded ? `${dinnerStats.plannedDays} Gün Dolu` : "..."}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link
              href="/dinner"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-2.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-700 transition text-center"
            >
              Haftalık Plan
            </Link>
            <Link
              href="/dinner/meals"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-raised px-2.5 py-2.5 text-xs font-medium text-foreground hover:border-orange-500/40 transition text-center"
            >
              Tarifler
            </Link>
          </div>
        </div>

        {/* Card 3: Hane Gider */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all group">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl group-hover:scale-110 transition-transform">
                💰
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Bu Ay
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Hane Gider</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Ev bütçesi, kredi kartı ekstreleri ve kişi bazlı harcama paylaşımı.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Bu Ayki Gider:</span>
                <span className="font-bold text-foreground">
                  {isLoaded ? para(giderStats.totalExpense) : "..."}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Bu Ayki Gelir:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isLoaded ? para(giderStats.totalIncome) : "..."}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/gider"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <span>Bütçeyi Yönet</span>
            <span>→</span>
          </Link>
        </div>

        {/* Card 4: Hane Fit */}
        <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-md hover:border-teal-500/40 transition-all group">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-2xl group-hover:scale-110 transition-transform">
                📐
              </span>
              <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                {isLoaded && fitStats.profileName ? fitStats.profileName : "Fitness"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Hane Fit</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Kilo, vücut çevre ölçüleri ve U.S. Navy tahmini yağ oranı takibi.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Son Kilo:</span>
                <span className="font-bold text-foreground">
                  {isLoaded && fitStats.latestWeight ? `${fitStats.latestWeight} kg` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Tahmini Yağ:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {isLoaded && fitStats.latestBodyFat ? `%${fitStats.latestBodyFat}` : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link
              href="/fit"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-2.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition text-center"
            >
              Özet
            </Link>
            <Link
              href="/fit/measurements/new"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-raised px-2.5 py-2.5 text-xs font-medium text-foreground hover:border-teal-500/40 transition text-center"
            >
              + Ölçüm
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access Info Section */}
      <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xs">
        <h3 className="text-lg font-bold text-foreground mb-3">
          💡 Hızlı İpuçları
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm text-muted">
          <div className="rounded-2xl bg-surface-raised/60 p-4 border border-border/40">
            <strong className="block font-semibold text-foreground mb-1">
              🚗 Araç Masrafları
            </strong>
            Ödenen masrafları kutucuğu işaretleyerek tamamlayabilir, toplam ve kalan tutarı anında izleyebilirsiniz.
          </div>
          <div className="rounded-2xl bg-surface-raised/60 p-4 border border-border/40">
            <strong className="block font-semibold text-foreground mb-1">
              🍽️ Otomatik Alışveriş
            </strong>
            Akşam yemeklerini seçtiğinizde gerekli tüm malzemeler haftalık alışveriş listenize otomatik aktarılır.
          </div>
          <div className="rounded-2xl bg-surface-raised/60 p-4 border border-border/40">
            <strong className="block font-semibold text-foreground mb-1">
              💰 Bütçe Yedekleme
            </strong>
            Hane Gider sayfasından tüm ay verilerinizi tek tıkla JSON olarak dışa aktarabilir veya geri yükleyebilirsiniz.
          </div>
          <div className="rounded-2xl bg-surface-raised/60 p-4 border border-border/40">
            <strong className="block font-semibold text-foreground mb-1">
              📐 Vücut ve Yağ Takibi
            </strong>
            Hane Fit ile boyun ve bel ölçülerinizi girerek yağ oranınızı U.S. Navy standardına göre takip edin.
          </div>
        </div>
      </section>
    </div>
  );
}
