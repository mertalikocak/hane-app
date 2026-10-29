"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentWeekStart } from "@/lib/date/week";
import { STORAGE_KEYS, type LocalMeal, type LocalPlanEntry } from "@/lib/local-storage/store";
import { ayAnahtariOlustur, ayVerisiOku } from "@/storage/ayDeposu";
import { ayToplamGirisGideri, ayToplamGelir } from "@/domain/ekstreHesapla";
import { getProfiles, getActiveProfileId, getProfileStats } from "@/storage/bodyStorage";
import { getCalendarEvents } from "@/storage/calendarStorage";
import { getWishlistItems } from "@/storage/wishlistStorage";
import { getCleaningStats, CLEANING_EVENT_NAME } from "@/storage/cleaningStorage";
import { getWeddingData, getWeddingStats, WEDDING_EVENT_NAME } from "@/storage/weddingStorage";
import { getDailyRecord, calculateMacroSummary } from "@/storage/calorieStorage";
import {
  DEFAULT_NAV_ITEMS,
  getCustomSidebarOrder,
  getHiddenSidebarItems,
  getSortedNavItems,
  type NavItem,
} from "@/storage/sidebarStorage";

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

export default function DashboardPage() {
  const [cardoStats, setCardoStats] = useState({ count: 0, total: 0, remaining: 0 });
  const [dinnerStats, setDinnerStats] = useState({ mealCount: 0, plannedDays: 0 });
  const [calendarStats, setCalendarStats] = useState({ totalCount: 0, upcomingCount: 0 });
  const [giderStats, setGiderStats] = useState({ totalExpense: 0, totalIncome: 0 });
  const [wishlistStats, setWishlistStats] = useState({ totalCount: 0, pendingCount: 0, completedCount: 0 });
  const [fitStats, setFitStats] = useState<{
    profileName: string;
    latestWeight?: number;
    latestBodyFat?: number;
    totalMeasurements: number;
  }>({ profileName: "", totalMeasurements: 0 });
  const [cleaningStats, setCleaningStats] = useState({
    cleanedTodayCount: 0,
    dueRoomsCount: 0,
    freshRoomsCount: 0,
  });
  const [weddingStats, setWeddingStats] = useState({
    kalanKumbara: 0,
    toplamMaddeSayisi: 0,
    tamamlananSayisi: 0,
  });
  const [calorieStats, setCalorieStats] = useState({
    consumed: 0,
    target: 2000,
    remaining: 2000,
    itemCount: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Menüdeki sıralamaya ve gizlilik ayarlarına tam uyumlu uygulama listesi
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_NAV_ITEMS.filter((i) => i.href !== "/");
    return getSortedNavItems(
      DEFAULT_NAV_ITEMS,
      getCustomSidebarOrder(),
      getHiddenSidebarItems()
    ).filter((i) => i.href !== "/");
  });

  const refreshNavItems = () => {
    setNavItems(
      getSortedNavItems(
        DEFAULT_NAV_ITEMS,
        getCustomSidebarOrder(),
        getHiddenSidebarItems()
      ).filter((i) => i.href !== "/")
    );
  };

  const loadDashboardData = () => {
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

      // 3. Calendar Stats
      const calEvents = getCalendarEvents();
      const today = new Date().toISOString().split("T")[0];
      const upcoming = calEvents.filter((e) => e.date >= today).length;
      setCalendarStats({ totalCount: calEvents.length, upcomingCount: upcoming });

      // 4. Gider Stats
      const now = new Date();
      const ayAnahtar = ayAnahtariOlustur(now.getFullYear(), now.getMonth());
      const ayVeri = ayVerisiOku(ayAnahtar);
      const totalExpense = ayToplamGirisGideri(ayVeri);
      const totalIncome = ayToplamGelir(ayVeri);
      setGiderStats({ totalExpense, totalIncome });

      // 5. Fit Stats
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
      } else {
        setFitStats({ profileName: "", totalMeasurements: 0 });
      }

      // 6. Wishlist Stats
      const wishItems = getWishlistItems();
      const completedCount = wishItems.filter((w) => w.completed).length;
      setWishlistStats({
        totalCount: wishItems.length,
        pendingCount: wishItems.length - completedCount,
        completedCount,
      });

      // 7. Cleaning Stats
      const cleanSt = getCleaningStats();
      setCleaningStats({
        cleanedTodayCount: cleanSt.cleanedTodayCount,
        dueRoomsCount: cleanSt.dueRoomsCount,
        freshRoomsCount: cleanSt.freshRoomsCount,
      });

      // 8. Wedding Stats
      const wedData = getWeddingData();
      const wedSt = getWeddingStats(wedData);
      setWeddingStats({
        kalanKumbara: wedSt.kalanKumbara,
        toplamMaddeSayisi: wedSt.toplamMaddeSayisi,
        tamamlananSayisi: wedSt.tamamlananSayisi,
      });

      // 9. Calorie Stats
      const profileIdForCal = activeProfile?.id || "default";
      const calRecord = getDailyRecord(today, profileIdForCal);
      const macroSummary = calculateMacroSummary(calRecord.items);
      const consumed = Math.round(macroSummary.calories);
      const target = Math.round(calRecord.targetCalories);
      setCalorieStats({
        consumed,
        target,
        remaining: Math.max(0, target - consumed),
        itemCount: calRecord.items.length,
      });
    } catch (e) {
      console.error("Dashboard loading error", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    refreshNavItems();
    loadDashboardData();

    const handleProfileChange = () => loadDashboardData();
    const handleOrderChange = () => refreshNavItems();

    window.addEventListener("fit_profile_changed", handleProfileChange);
    window.addEventListener("fit_profiles_updated", handleProfileChange);
    window.addEventListener("calendar_events_updated", handleProfileChange);
    window.addEventListener("wishlist_items_updated", handleProfileChange);
    window.addEventListener(CLEANING_EVENT_NAME, handleProfileChange);
    window.addEventListener(WEDDING_EVENT_NAME, handleProfileChange);
    window.addEventListener("hane_calorie_updated", handleProfileChange);
    window.addEventListener("hane_sidebar_order_changed", handleOrderChange);
    window.addEventListener("storage", handleProfileChange);
    window.addEventListener("storage", handleOrderChange);

    return () => {
      window.removeEventListener("fit_profile_changed", handleProfileChange);
      window.removeEventListener("fit_profiles_updated", handleProfileChange);
      window.removeEventListener("calendar_events_updated", handleProfileChange);
      window.removeEventListener("wishlist_items_updated", handleProfileChange);
      window.removeEventListener(CLEANING_EVENT_NAME, handleProfileChange);
      window.removeEventListener(WEDDING_EVENT_NAME, handleProfileChange);
      window.removeEventListener("hane_calorie_updated", handleProfileChange);
      window.removeEventListener("hane_sidebar_order_changed", handleOrderChange);
      window.removeEventListener("storage", handleProfileChange);
      window.removeEventListener("storage", handleOrderChange);
    };
  }, []);

  const todayFormatted = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const renderAppCard = (item: NavItem) => {
    switch (item.href) {
      // Hane Dinner
      case "/dinner":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl group-hover:scale-110 transition-transform">
                  🍽️
                </span>
                <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                  {isLoaded ? `${dinnerStats.plannedDays} / 7 Gün` : "..."}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
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
        );

      // Hane Shopping
      case "/shopping":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl group-hover:scale-110 transition-transform">
                  🛒
                </span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  Haftalık Liste
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Gıda Listesi:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Hane Dinner ile Senkron
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Genel Alışveriş:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Haftalık & Aktarılabilir
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/shopping"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition"
            >
              <span>Alışveriş Listesini Aç</span>
              <span>→</span>
            </Link>
          </div>
        );

      // Hane Calendar
      case "/calendar":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-indigo-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl group-hover:scale-110 transition-transform">
                  📅
                </span>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {isLoaded ? `${calendarStats.upcomingCount} Yaklaşan` : "..."}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Toplam Etkinlik:</span>
                  <span className="font-bold text-foreground">
                    {isLoaded ? `${calendarStats.totalCount} Etkinlik` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Yaklaşan:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {isLoaded ? `${calendarStats.upcomingCount} Plan` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/calendar"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <span>Takvimi Aç</span>
              <span>→</span>
            </Link>
          </div>
        );

      // Hane Gider
      case "/gider":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl group-hover:scale-110 transition-transform">
                  💰
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Bu Ay
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
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
        );

      // Hane Fit
      case "/fit/dashboard":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-teal-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-2xl group-hover:scale-110 transition-transform">
                  📐
                </span>
                <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                  {isLoaded && fitStats.profileName ? fitStats.profileName : "Fitness"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
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
                href="/fit/dashboard"
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
        );

      // Hane Kalori
      case "/kalori":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl group-hover:scale-110 transition-transform">
                  🥑
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {isLoaded ? (calorieStats.consumed > 0 ? `${calorieStats.consumed} kcal` : "AI Destekli") : "..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Bugün Alınan:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isLoaded ? `${calorieStats.consumed} kcal` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Hedef / Durum:</span>
                  <span className="font-bold text-foreground">
                    {isLoaded
                      ? calorieStats.remaining > 0
                        ? `${calorieStats.remaining} kcal kaldı`
                        : "Hedefe ulaşıldı"
                      : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/kalori"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <span>Kalori Takibini Aç</span>
              <span>→</span>
            </Link>
          </div>
        );

      // Hane Wish List
      case "/wishlist":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-rose-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-2xl group-hover:scale-110 transition-transform">
                  🎁
                </span>
                <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                  {isLoaded ? `${wishlistStats.pendingCount} Bekleyen` : "..."}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Toplam İstek:</span>
                  <span className="font-bold text-foreground">
                    {isLoaded ? `${wishlistStats.totalCount} Ürün` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Alınan / Biten:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isLoaded ? `${wishlistStats.completedCount} İstek` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/wishlist"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition"
            >
              <span>İstek Listesini Aç</span>
              <span>→</span>
            </Link>
          </div>
        );

      // Hane Cleaning
      case "/cleaning":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-sky-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-2xl group-hover:scale-110 transition-transform">
                  🧹
                </span>
                <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                  {isLoaded ? `${cleaningStats.cleanedTodayCount} Bugün Temizlendi` : "..."}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Tertemiz Odalar:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isLoaded ? `${cleaningStats.freshRoomsCount} Oda` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Temizlik Bekleyen:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {isLoaded ? `${cleaningStats.dueRoomsCount} Oda` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/cleaning"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"
            >
              <span>Temizlik Kontrolü</span>
              <span>→</span>
            </Link>
          </div>
        );

      // Hane Wedding
      case "/wedding":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl group-hover:scale-110 transition-transform">
                  💍
                </span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {isLoaded ? `${weddingStats.tamamlananSayisi}/${weddingStats.toplamMaddeSayisi} Tamam` : "..."}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-surface-raised p-4 border border-border/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Kalan Kumbara:</span>
                  <span className="font-bold text-amber-500 dark:text-amber-400">
                    {isLoaded ? para(weddingStats.kalanKumbara) : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Kalan Kalemler:</span>
                  <span className="font-bold text-foreground">
                    {isLoaded ? `${weddingStats.toplamMaddeSayisi - weddingStats.tamamlananSayisi} Alınacak` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/wedding"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-stone-950 shadow-sm transition"
            >
              <span>Düğün Kumbarasını Aç</span>
              <span>→</span>
            </Link>
          </div>
        );

      // Hane Car
      case "/cardolist":
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl group-hover:scale-110 transition-transform">
                  🚗
                </span>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  {isLoaded ? `${cardoStats.count} Masraf` : "..."}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
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
        );

      // Fallback for any other custom or new app
      default:
        return (
          <div
            key={item.href}
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {item.badge}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {item.description}
              </p>
            </div>

            <Link
              href={item.href}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
            >
              <span>Uygulamayı Aç</span>
              <span>→</span>
            </Link>
          </div>
        );
    }
  };

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
            Bütçe, yemek planı, kalori, takvim, araç masrafları ve ev yönetimi tek çatı altında.
          </p>
        </div>
        {/* Decorative background circles */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 h-48 w-48 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />
      </section>

      {/* Grid of Main Apps (Menüdeki sıralama ile %100 senkron) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {navItems.map((item) => renderAppCard(item))}
      </section>
    </div>
  );
}
