"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentWeekStart } from "@/lib/date/week";
import {
  STORAGE_KEYS,
  type LocalMeal,
  type LocalPlanEntry,
  type LocalShoppingItem,
} from "@/lib/local-storage/store";
import {
  getCustomShoppingList,
  toggleCustomShoppingItem,
} from "@/storage/shoppingStorage";
import type { ShoppingCustomItem } from "@/domain/shoppingTypes";
import { ayAnahtariOlustur, ayVerisiOku } from "@/storage/ayDeposu";
import { ayToplamGirisGideri, ayToplamGelir } from "@/domain/ekstreHesapla";
import { getProfiles, getActiveProfileId, getProfileStats } from "@/storage/bodyStorage";
import { getCalendarEvents } from "@/storage/calendarStorage";
import type { CalendarEvent } from "@/domain/calendarTypes";
import { getWishlistItems } from "@/storage/wishlistStorage";
import {
  getCleaningStats,
  getRoomStatuses,
  CLEANING_EVENT_NAME,
} from "@/storage/cleaningStorage";
import { getWeddingData, getWeddingStats, WEDDING_EVENT_NAME } from "@/storage/weddingStorage";
import { getDailyRecord, calculateMacroSummary } from "@/storage/calorieStorage";
import {
  DEFAULT_NAV_ITEMS,
  getCustomSidebarOrder,
  getHiddenSidebarItems,
  getSortedNavItems,
  type NavItem,
} from "@/storage/sidebarStorage";
import { triggerQuickAction } from "@/components/quick-action/QuickActionLauncher";
import {
  ModuleLucideIcon,
  PlusIcon,
  CalendarIcon,
  UtensilsIcon,
  ShoppingBagIcon,
  WalletIcon,
  SparklesCleanIcon,
  FlameIcon,
  ActivityIcon,
  GiftIcon,
  HeartRingIcon,
  CarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  CheckIcon,
} from "@/components/ui/Icons";

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

export default function DashboardPage() {
  const [cardoStats, setCardoStats] = useState({ count: 0, total: 0, remaining: 0 });
  const [dinnerStats, setDinnerStats] = useState<{
    mealCount: number;
    plannedDays: number;
    todayMealNames: string[];
  }>({ mealCount: 0, plannedDays: 0, todayMealNames: [] });
  const [shoppingStats, setShoppingStats] = useState<{
    pendingCount: number;
    completedCount: number;
    totalCount: number;
    customItems: ShoppingCustomItem[];
    recipePendingCount: number;
  }>({
    pendingCount: 0,
    completedCount: 0,
    totalCount: 0,
    customItems: [],
    recipePendingCount: 0,
  });
  const [calendarStats, setCalendarStats] = useState<{
    totalCount: number;
    upcomingCount: number;
    upcomingEvents: CalendarEvent[];
  }>({ totalCount: 0, upcomingCount: 0, upcomingEvents: [] });
  const [giderStats, setGiderStats] = useState({ totalExpense: 0, totalIncome: 0 });
  const [wishlistStats, setWishlistStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    completedCount: 0,
  });
  const [fitStats, setFitStats] = useState<{
    profileName: string;
    latestWeight?: number;
    latestBodyFat?: number;
    totalMeasurements: number;
  }>({ profileName: "", totalMeasurements: 0 });
  const [cleaningStats, setCleaningStats] = useState<{
    cleanedTodayCount: number;
    dueRoomsCount: number;
    freshRoomsCount: number;
    dueRoomNames: string[];
  }>({
    cleanedTodayCount: 0,
    dueRoomsCount: 0,
    freshRoomsCount: 0,
    dueRoomNames: [],
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

  const [navItems, setNavItems] = useState<NavItem[]>(() =>
    DEFAULT_NAV_ITEMS.filter((i) => i.href !== "/")
  );

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
      } else {
        setCardoStats({ count: 0, total: 0, remaining: 0 });
      }

      // 2. Dinner Stats & Today's Planned Meals
      const mealsData = localStorage.getItem(STORAGE_KEYS.meals);
      const plansData = localStorage.getItem(STORAGE_KEYS.plans);
      const meals: LocalMeal[] = mealsData ? JSON.parse(mealsData) : [];
      const plans: Record<string, LocalPlanEntry[]> = plansData ? JSON.parse(plansData) : {};
      const currentWeek = getCurrentWeekStart();
      const currentAssignments = plans[currentWeek] ?? [];
      const plannedDays = new Set(currentAssignments.map((a) => a.dayOfWeek)).size;

      const jsDay = new Date().getDay();
      const todayDayOfWeek = jsDay === 0 ? 7 : jsDay;
      const todayMealIds = currentAssignments
        .filter((a) => a.dayOfWeek === todayDayOfWeek)
        .map((a) => a.mealId);
      const mealMap = new Map(meals.map((m) => [m.id, m.name]));
      const todayMealNames = todayMealIds
        .map((id) => mealMap.get(id))
        .filter((name): name is string => Boolean(name));

      setDinnerStats({ mealCount: meals.length, plannedDays, todayMealNames });

      // 3. Shopping Stats (Custom + Recipe Shopping)
      const customShopItems = getCustomShoppingList();
      const recipeShopRaw = localStorage.getItem(STORAGE_KEYS.shopping);
      const recipeShopMap: Record<string, LocalShoppingItem[]> = recipeShopRaw
        ? JSON.parse(recipeShopRaw)
        : {};

      let recipeAllItems: LocalShoppingItem[] = [];
      if (Array.isArray(recipeShopMap)) {
        recipeAllItems = recipeShopMap;
      } else {
        for (const items of Object.values(recipeShopMap)) {
          if (Array.isArray(items)) {
            recipeAllItems.push(...items);
          }
        }
      }

      let clearedFoodKeys = new Set<string>();
      try {
        const raw = localStorage.getItem("hane-shopping:cleared_food_keys");
        if (raw) clearedFoodKeys = new Set(JSON.parse(raw));
      } catch {
        // ignore
      }
      const activeRecipeItems = recipeAllItems.filter((i) => !clearedFoodKeys.has(i.key));

      const customCompleted = customShopItems.filter((i) => i.isCompleted).length;
      const customPending = customShopItems.length - customCompleted;
      const recipeCompleted = activeRecipeItems.filter((i) => i.isCompleted).length;
      const recipePending = activeRecipeItems.length - recipeCompleted;

      setShoppingStats({
        pendingCount: customPending + recipePending,
        completedCount: customCompleted + recipeCompleted,
        totalCount: customShopItems.length + activeRecipeItems.length,
        customItems: customShopItems,
        recipePendingCount: recipePending,
      });

      // 4. Calendar Stats & Upcoming Events
      const calEvents = getCalendarEvents();
      const today = new Date().toISOString().split("T")[0];
      const upcomingList = calEvents
        .filter((e) => e.date >= today)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.time || "").localeCompare(b.time || "");
        });
      setCalendarStats({
        totalCount: calEvents.length,
        upcomingCount: upcomingList.length,
        upcomingEvents: upcomingList.slice(0, 4),
      });

      // 5. Gider Stats
      const now = new Date();
      const ayAnahtar = ayAnahtariOlustur(now.getFullYear(), now.getMonth());
      const ayVeri = ayVerisiOku(ayAnahtar);
      const totalExpense = ayToplamGirisGideri(ayVeri);
      const totalIncome = ayToplamGelir(ayVeri);
      setGiderStats({ totalExpense, totalIncome });

      // 6. Fit Stats
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

      // 7. Wishlist Stats
      const wishItems = getWishlistItems();
      const completedCount = wishItems.filter((w) => w.completed).length;
      setWishlistStats({
        totalCount: wishItems.length,
        pendingCount: wishItems.length - completedCount,
        completedCount,
      });

      // 8. Cleaning Stats & Due Rooms
      const cleanSt = getCleaningStats();
      const roomStatuses = getRoomStatuses();
      const dueRoomNames = roomStatuses
        .filter((s) => s.statusLevel === "due" || s.statusLevel === "overdue")
        .map((s) => s.room.name);
      setCleaningStats({
        cleanedTodayCount: cleanSt.cleanedTodayCount,
        dueRoomsCount: cleanSt.dueRoomsCount,
        freshRoomsCount: cleanSt.freshRoomsCount,
        dueRoomNames,
      });

      // 9. Wedding Stats
      const wedData = getWeddingData();
      const wedSt = getWeddingStats(wedData);
      setWeddingStats({
        kalanKumbara: wedSt.kalanKumbara,
        toplamMaddeSayisi: wedSt.toplamMaddeSayisi,
        tamamlananSayisi: wedSt.tamamlananSayisi,
      });

      // 10. Calorie Stats
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

    const handleDataRefresh = () => loadDashboardData();
    const handleOrderChange = () => refreshNavItems();

    window.addEventListener("fit_profile_changed", handleDataRefresh);
    window.addEventListener("fit_profiles_updated", handleDataRefresh);
    window.addEventListener("calendar_events_updated", handleDataRefresh);
    window.addEventListener("wishlist_items_updated", handleDataRefresh);
    window.addEventListener(CLEANING_EVENT_NAME, handleDataRefresh);
    window.addEventListener(WEDDING_EVENT_NAME, handleDataRefresh);
    window.addEventListener("hane_calorie_updated", handleDataRefresh);
    window.addEventListener("hane-shopping:updated", handleDataRefresh);
    window.addEventListener("hane-dinner:storage", handleDataRefresh);
    window.addEventListener("hane-gider:updated", handleDataRefresh);
    window.addEventListener("hane_sidebar_order_changed", handleOrderChange);
    window.addEventListener("storage", handleDataRefresh);
    window.addEventListener("storage", handleOrderChange);

    return () => {
      window.removeEventListener("fit_profile_changed", handleDataRefresh);
      window.removeEventListener("fit_profiles_updated", handleDataRefresh);
      window.removeEventListener("calendar_events_updated", handleDataRefresh);
      window.removeEventListener("wishlist_items_updated", handleDataRefresh);
      window.removeEventListener(CLEANING_EVENT_NAME, handleDataRefresh);
      window.removeEventListener(WEDDING_EVENT_NAME, handleDataRefresh);
      window.removeEventListener("hane_calorie_updated", handleDataRefresh);
      window.removeEventListener("hane-shopping:updated", handleDataRefresh);
      window.removeEventListener("hane-dinner:storage", handleDataRefresh);
      window.removeEventListener("hane-gider:updated", handleDataRefresh);
      window.removeEventListener("hane_sidebar_order_changed", handleOrderChange);
      window.removeEventListener("storage", handleDataRefresh);
      window.removeEventListener("storage", handleOrderChange);
    };
  }, []);

  const handleToggleShoppingItem = (id: string) => {
    toggleCustomShoppingItem(id);
    loadDashboardData();
  };

  const todayFormatted = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const formatEventDateShort = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      day: d,
      month: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(dt),
    };
  };

  const getRelativeDayLabel = (dateStr: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr === todayStr) return "Bugün";
    const [y, m, d] = dateStr.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Yarın";
    return `${diffDays} gün sonra`;
  };

  const totalPendingTasks =
    shoppingStats.pendingCount + cleaningStats.dueRoomsCount + wishlistStats.pendingCount;
  const totalCompletedTasks =
    shoppingStats.completedCount + cleaningStats.cleanedTodayCount + wishlistStats.completedCount;

  const calorieProgressPct =
    calorieStats.target > 0
      ? Math.min(100, Math.round((calorieStats.consumed / calorieStats.target) * 100))
      : 0;

  const renderAppCard = (item: NavItem) => {
    switch (item.href) {
      case "/dinner":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-amber-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <UtensilsIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums whitespace-nowrap">
                  {isLoaded ? `${dinnerStats.plannedDays} / 7 Gün` : "..."}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Kayıtlı Tarif</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded ? `${dinnerStats.mealCount} Tarif` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Bu Hafta</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {isLoaded ? `${dinnerStats.plannedDays} Gün Planlı` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link href="/dinner" className="inline-flex min-h-[38px] items-center justify-center rounded-[10px] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-3 whitespace-nowrap transition shadow-xs">
                Haftalık Plan
              </Link>
              <Link href="/dinner/meals" className="secondary-button text-xs py-2 px-3 whitespace-nowrap">
                Tarifler
              </Link>
            </div>
          </div>
        );

      case "/shopping":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-emerald-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShoppingBagIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums whitespace-nowrap">
                  {isLoaded ? `${shoppingStats.pendingCount} Alınacak` : "Haftalık Liste"}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Gıda Listesi</span>
                  <span className="font-semibold text-success whitespace-nowrap">
                    Dinner ile Senkron
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Genel Alışveriş</span>
                  <span className="font-semibold text-foreground tabular-nums whitespace-nowrap">
                    {isLoaded
                      ? `${shoppingStats.completedCount}/${shoppingStats.totalCount} Tamam`
                      : "Aktarılabilir"}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/shopping" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>Alışveriş Listesini Aç</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      case "/calendar":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-indigo-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 tabular-nums whitespace-nowrap">
                  {isLoaded ? `${calendarStats.upcomingCount} Yaklaşan` : "..."}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Toplam Etkinlik</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded ? `${calendarStats.totalCount} Etkinlik` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Yaklaşan</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {isLoaded ? `${calendarStats.upcomingCount} Plan` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/calendar" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>Takvimi Aç</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      case "/gider":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-teal-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <WalletIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap">
                  Bu Ay
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Bu Ayki Gider</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded ? para(giderStats.totalExpense) : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Bu Ayki Gelir</span>
                  <span className="font-semibold text-success tabular-nums">
                    {isLoaded ? para(giderStats.totalIncome) : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/gider" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-teal-600 hover:bg-teal-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>Bütçeyi Yönet</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      case "/fit/dashboard":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-cyan-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <ActivityIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                  {isLoaded && fitStats.profileName ? fitStats.profileName : "Fitness"}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Son Kilo</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded && fitStats.latestWeight ? `${fitStats.latestWeight} kg` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Tahmini Yağ</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {isLoaded && fitStats.latestBodyFat ? `%${fitStats.latestBodyFat}` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link href="/fit/dashboard" className="inline-flex min-h-[38px] items-center justify-center rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs py-2 px-3 whitespace-nowrap transition shadow-xs">
                Özet
              </Link>
              <Link href="/fit/measurements/new" className="secondary-button text-xs py-2 px-3 whitespace-nowrap">
                + Ölçüm
              </Link>
            </div>
          </div>
        );

      case "/kalori":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-rose-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <FlameIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 tabular-nums whitespace-nowrap">
                  {isLoaded
                    ? calorieStats.consumed > 0
                      ? `${calorieStats.consumed} kcal`
                      : "AI Destekli"
                    : "..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  AI
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Bugün Alınan</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    {isLoaded ? `${calorieStats.consumed} kcal` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Hedef / Durum</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded
                      ? calorieStats.remaining > 0
                        ? `${calorieStats.remaining} kcal kaldı`
                        : "Hedefe ulaşıldı"
                      : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/kalori" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>Kalori Takibini Aç</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      case "/wishlist":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-violet-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <GiftIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 tabular-nums whitespace-nowrap">
                  {isLoaded ? `${wishlistStats.pendingCount} Bekleyen` : "..."}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Toplam İstek</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded ? `${wishlistStats.totalCount} Ürün` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Alınan / Biten</span>
                  <span className="font-semibold text-success tabular-nums">
                    {isLoaded ? `${wishlistStats.completedCount} İstek` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/wishlist" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-violet-600 hover:bg-violet-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>İstek Listesini Aç</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      case "/cleaning":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-sky-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  <SparklesCleanIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 tabular-nums whitespace-nowrap">
                  {isLoaded ? `${cleaningStats.cleanedTodayCount} Bugün Temizlendi` : "..."}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Tertemiz Odalar</span>
                  <span className="font-semibold text-success tabular-nums">
                    {isLoaded ? `${cleaningStats.freshRoomsCount} Oda` : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Temizlik Bekleyen</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      cleaningStats.dueRoomsCount > 0 ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {isLoaded ? `${cleaningStats.dueRoomsCount} Oda` : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/cleaning" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-sky-600 hover:bg-sky-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>Temizlik Kontrolü</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      case "/wedding":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-pink-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  <HeartRingIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 text-xs font-semibold text-pink-700 dark:text-pink-300 tabular-nums whitespace-nowrap">
                  {isLoaded
                    ? `${weddingStats.tamamlananSayisi}/${weddingStats.toplamMaddeSayisi} Tamam`
                    : "..."}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Kalan Kumbara</span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400 tabular-nums">
                    {isLoaded ? para(weddingStats.kalanKumbara) : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Kalan Kalemler</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded
                      ? `${weddingStats.toplamMaddeSayisi - weddingStats.tamamlananSayisi} Alınacak`
                      : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/wedding" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-pink-600 hover:bg-pink-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>Düğün Kumbarasını Aç</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      case "/cardolist":
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between hover:border-blue-500/40">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <CarIcon className="h-5 w-5" />
                </span>
                <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 tabular-nums whitespace-nowrap">
                  {isLoaded ? `${cardoStats.count} Masraf` : "..."}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>

              <div className="mt-4 space-y-2 ds-card-recessed">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Toplam Masraf</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {isLoaded ? para(cardoStats.total) : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-foreground-secondary">Ödenmeyi Bekleyen</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      cardoStats.remaining > 0 ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {isLoaded ? para(cardoStats.remaining) : "..."}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/cardolist" className="mt-5 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full text-xs py-2.5 whitespace-nowrap transition shadow-xs">
              <span>Masrafları Yönet</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );

      default:
        return (
          <div key={item.href} className="ds-card-interactive flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/10 border border-primary/20 text-primary">
                  <ModuleLucideIcon href={item.href} className="h-5 w-5" />
                </span>
                {item.badge && (
                  <span className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
              <p className="mt-1 text-xs text-muted">{item.description}</p>
            </div>

            <Link href={item.href} className="mt-5 primary-button w-full text-xs py-2.5 whitespace-nowrap">
              <span>Uygulamayı Aç</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. PERSONALIZED WELCOME & IMMEDIATE HOUSEHOLD ACTIONS */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-orange-500 via-amber-600 to-rose-600 p-6 sm:p-7 text-white shadow-md">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/25 text-white">
              <CalendarIcon className="h-3.5 w-3.5 text-white" />
              <span className="capitalize">{todayFormatted}</span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-white leading-tight">
              {isLoaded && fitStats.profileName
                ? `Hoş Geldiniz, ${fitStats.profileName}`
                : "Hoş Geldiniz, Hane Yönetim Paneli"}
            </h1>

            <p className="text-sm text-white/90 max-w-2xl font-medium">
              Ev bütçesi, haftalık yemek planı, alışveriş, temizlik, takvim ve kişisel sağlık verileriniz tek ekranda.
            </p>
          </div>

          {/* Household Daily Status Chips */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 shrink-0">
            <div className="rounded-xl bg-white/15 backdrop-blur-md border border-white/20 px-3 py-2 sm:px-3.5 text-center">
              <span className="block text-[11px] font-medium text-white/80">
                Bekleyen
              </span>
              <span className="text-sm sm:text-base font-bold text-white tabular-nums whitespace-nowrap">
                {isLoaded ? `${totalPendingTasks} Görev` : "..."}
              </span>
            </div>

            <div className="rounded-xl bg-emerald-500/25 backdrop-blur-md border border-emerald-300/40 px-3 py-2 sm:px-3.5 text-center">
              <span className="block text-[11px] font-medium text-emerald-100">
                Tamamlanan
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-100 tabular-nums whitespace-nowrap">
                {isLoaded ? `${totalCompletedTasks} Tamam` : "..."}
              </span>
            </div>

            <div className="rounded-xl bg-amber-400/25 backdrop-blur-md border border-amber-200/40 px-3 py-2 sm:px-3.5 text-center">
              <span className="block text-[11px] font-medium text-amber-100">
                Yaklaşan
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-100 tabular-nums whitespace-nowrap">
                {isLoaded ? `${calendarStats.upcomingCount} Etkinlik` : "..."}
              </span>
            </div>
          </div>
        </div>

        {/* Immediate Quick Action Shortcuts */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white/85 shrink-0">
            Hızlı İşlemler
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => triggerQuickAction("gider")}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <PlusIcon className="h-3.5 w-3.5 text-emerald-200" />
              <span>Hızlı Gider</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction("shopping")}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <ShoppingBagIcon className="h-3.5 w-3.5 text-teal-200" />
              <span>Alışveriş Ürünü</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction("cleaning")}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <SparklesCleanIcon className="h-3.5 w-3.5 text-sky-200" />
              <span>Temizlik İşaretle</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction("calendar")}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-indigo-200" />
              <span>Etkinlik Ekle</span>
            </button>

            <button
              type="button"
              onClick={() => triggerQuickAction("cardo")}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <CarIcon className="h-3.5 w-3.5 text-blue-200" />
              <span>Araç Masrafı</span>
            </button>
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 h-48 w-48 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />
      </section>

      {/* 2. PRIMARY HOUSEHOLD KPI OVERVIEW (1-col Mobile, 2x2 Tablet, 4-col Desktop XL) */}
      <section
        aria-label="Hane Temel Göstergeleri"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4"
      >
        {/* KPI 1: Monthly Budget */}
        <Link
          href="/gider"
          className="ds-card-interactive p-4 sm:p-5 flex flex-col justify-between group hover:border-teal-500/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground-secondary">
              Bu Ayki Hane Gideri
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <WalletIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {isLoaded ? para(giderStats.totalExpense) : "..."}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1 text-xs">
              <span className="text-muted">Aylık Gelir:</span>
              <span className="font-semibold text-success tabular-nums">
                {isLoaded ? para(giderStats.totalIncome) : "..."}
              </span>
            </div>
          </div>
        </Link>

        {/* KPI 2: Tonight's Dinner */}
        <Link
          href="/dinner"
          className="ds-card-interactive p-4 sm:p-5 flex flex-col justify-between group hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground-secondary">
              Günün Akşam Yemeği
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <UtensilsIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-sm sm:text-base font-semibold text-foreground line-clamp-1">
              {isLoaded
                ? dinnerStats.todayMealNames.length > 0
                  ? dinnerStats.todayMealNames.join(" & ")
                  : "Bugün için planlanmadı"
                : "..."}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1 text-xs">
              <span className="text-muted">Haftalık Plan:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                {isLoaded ? `${dinnerStats.plannedDays} / 7 Gün` : "..."}
              </span>
            </div>
          </div>
        </Link>

        {/* KPI 3: Daily Calorie Progress */}
        <Link
          href="/kalori"
          className="ds-card-interactive p-4 sm:p-5 flex flex-col justify-between group hover:border-rose-500/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground-secondary">
              Günlük Kalori Takibi
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <FlameIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {isLoaded ? `${calorieStats.consumed}` : "..."}
                <span className="text-[11px] sm:text-xs font-medium text-muted ml-1">
                  / {calorieStats.target} kcal
                </span>
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-background-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-200"
                style={{ width: `${calorieProgressPct}%` }}
              />
            </div>
          </div>
        </Link>

        {/* KPI 4: Home Hygiene & Cleaning */}
        <Link
          href="/cleaning"
          className="ds-card-interactive p-4 sm:p-5 flex flex-col justify-between group hover:border-sky-500/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground-secondary">
              Ev Temizlik Durumu
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <SparklesCleanIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {isLoaded
                ? cleaningStats.dueRoomsCount > 0
                  ? `${cleaningStats.dueRoomsCount} Oda Bekliyor`
                  : `${cleaningStats.freshRoomsCount} Oda Temiz`
                : "..."}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1 text-xs">
              <span className="text-muted">Bugün Temizlenen:</span>
              <span className="font-semibold text-success tabular-nums whitespace-nowrap">
                {isLoaded ? `${cleaningStats.cleanedTodayCount} Oda` : "..."}
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* 3. DAILY TASKS, UPCOMING CALENDAR & HOUSEHOLD SUMMARY */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {/* Panel 1: Daily Tasks & Shopping Checklist (Pending vs Completed) */}
        <div className="ds-card flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircleIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground truncate">
                    Günlük Görevler & Alışveriş
                  </h2>
                  <p className="text-[11px] text-muted truncate">
                    Bekleyen ve tamamlanan ihtiyaçlar
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-lg bg-background px-2.5 py-1 text-xs font-semibold text-foreground border border-border tabular-nums">
                {isLoaded
                  ? `${shoppingStats.completedCount}/${shoppingStats.totalCount}`
                  : "..."}
              </span>
            </div>

            {/* Overdue Cleaning Alert if any */}
            {isLoaded && cleaningStats.dueRoomNames.length > 0 && (
              <div className="mt-3.5 rounded-[10px] border border-warning-border bg-warning-bg px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="text-xs text-foreground">
                  <span className="font-semibold text-warning block">
                    Temizlik Zamanı Gelen Odalar
                  </span>
                  <span className="text-foreground-secondary line-clamp-1">
                    {cleaningStats.dueRoomNames.join(", ")}
                  </span>
                </div>
                <Link
                  href="/cleaning"
                  className="text-xs font-semibold text-warning hover:underline shrink-0"
                >
                  Kontrol Et →
                </Link>
              </div>
            )}

            {/* Shopping Items List or Empty State */}
            <div className="mt-3.5 flex-1 flex flex-col">
              {isLoaded && shoppingStats.customItems.length > 0 ? (
                <div className="space-y-2">
                  {shoppingStats.customItems.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleShoppingItem(item.id)}
                      className="w-full flex items-center justify-between gap-3 rounded-[10px] border border-border bg-background/60 hover:bg-surface-raised px-3 py-2 text-left transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            item.isCompleted
                              ? "bg-primary border-primary text-white"
                              : "bg-surface border-border-strong"
                          }`}
                        >
                          {item.isCompleted && <CheckIcon className="h-3 w-3" />}
                        </span>
                        <span
                          className={`text-xs font-medium truncate ${
                            item.isCompleted
                              ? "line-through text-muted"
                              : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      {item.quantity && (
                        <span className="text-[11px] font-medium text-muted shrink-0">
                          {item.quantity}
                        </span>
                      )}
                    </button>
                  ))}

                  {shoppingStats.recipePendingCount > 0 && (
                    <div className="rounded-[10px] border border-border-lavender bg-surface-lavender px-3 py-2 flex items-center justify-between text-xs">
                      <span className="text-foreground-secondary">
                        Yemek planından bekleyen malzeme:
                      </span>
                      <span className="font-semibold text-primary tabular-nums">
                        +{shoppingStats.recipePendingCount} malzeme
                      </span>
                    </div>
                  )}
                </div>
              ) : isLoaded && shoppingStats.recipePendingCount > 0 ? (
                <div className="flex-1 flex flex-col justify-center rounded-[10px] border border-border-lavender bg-surface-lavender p-4 space-y-1">
                  <span className="text-xs font-semibold text-foreground block">
                    Yemek Planı Malzemeleri Hazır
                  </span>
                  <p className="text-xs text-foreground-secondary">
                    Haftalık yemek planınızdan{" "}
                    <strong className="text-primary">{shoppingStats.recipePendingCount}</strong>{" "}
                    malzeme alışveriş listesinde bekliyor.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border-strong bg-background/50 p-5 text-center space-y-2.5 min-h-[160px]">
                  <p className="text-xs font-medium text-foreground-secondary max-w-[220px]">
                    Bu hafta için bekleyen alışveriş ürünü bulunmuyor.
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerQuickAction("shopping")}
                    className="accent-button min-h-[34px] px-3 py-1 text-xs"
                  >
                    <PlusIcon className="h-3.5 w-3.5 text-primary" />
                    <span>İlk Ürünü Ekle</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => triggerQuickAction("shopping")}
              className="inline-flex min-h-[34px] items-center py-1 text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer whitespace-nowrap"
            >
              + Hızlı Ürün Ekle
            </button>
            <Link
              href="/shopping"
              className="inline-flex min-h-[34px] items-center gap-1 py-1 text-xs font-medium text-foreground-secondary hover:text-foreground whitespace-nowrap"
            >
              <span>Tüm Listeyi Gör</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Panel 2: Upcoming Calendar Events */}
        <div className="ds-card flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground truncate">
                    Yaklaşan Etkinlikler
                  </h2>
                  <p className="text-[11px] text-muted truncate">
                    Hane takvimi ve özel gün hatırlatmaları
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-lg bg-background px-2.5 py-1 text-xs font-semibold text-foreground border border-border tabular-nums whitespace-nowrap">
                {isLoaded ? `${calendarStats.upcomingCount} Plan` : "..."}
              </span>
            </div>

            <div className="mt-3.5 flex-1 flex flex-col">
              {isLoaded && calendarStats.upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {calendarStats.upcomingEvents.map((evt) => {
                    const { day, month } = formatEventDateShort(evt.date);
                    const relLabel = getRelativeDayLabel(evt.date);
                    const isToday = relLabel === "Bugün";

                    return (
                      <Link
                        key={evt.id}
                        href="/calendar"
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-background/60 hover:bg-surface-raised px-3 py-2 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-surface border border-border text-center leading-none">
                            <span className="text-xs font-bold text-foreground tabular-nums">
                              {day}
                            </span>
                            <span className="text-[9px] font-semibold uppercase text-muted mt-0.5">
                              {month}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {evt.title}
                            </p>
                            <p className="text-[11px] text-muted">
                              {evt.time ? `Saat ${evt.time}` : "Tüm gün"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                            isToday
                              ? "bg-primary text-white"
                              : "bg-accent text-foreground border border-border-lavender"
                          }`}
                        >
                          {relLabel}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border-strong bg-background/50 p-5 text-center space-y-2.5 min-h-[160px]">
                  <p className="text-xs font-medium text-foreground-secondary max-w-[220px]">
                    Yaklaşan takvim etkinliği bulunmuyor.
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerQuickAction("calendar")}
                    className="accent-button min-h-[34px] px-3 py-1 text-xs"
                  >
                    <PlusIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Etkinlik Planla</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => triggerQuickAction("calendar")}
              className="inline-flex min-h-[34px] items-center py-1 text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer whitespace-nowrap"
            >
              + Etkinlik Ekle
            </button>
            <Link
              href="/calendar"
              className="inline-flex min-h-[34px] items-center gap-1 py-1 text-xs font-medium text-foreground-secondary hover:text-foreground whitespace-nowrap"
            >
              <span>Takvimi Aç</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Panel 3: Household Activity & Goals Summary */}
        <div className="ds-card flex flex-col justify-between md:col-span-2 xl:col-span-1">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  <ClockIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground truncate">
                    Hane Yaşam & Hedef Özeti
                  </h2>
                  <p className="text-[11px] text-muted truncate">
                    Sağlık, birikim, istekler ve araç durumu
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
              {/* Row 1: Hane Fit */}
              <Link
                href="/fit/dashboard"
                className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-background/60 hover:bg-surface-raised px-3.5 py-2.5 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ActivityIcon className="h-4 w-4 text-cyan-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block truncate">
                      Vücut & Fit Takibi
                    </span>
                    <span className="text-[11px] text-muted block truncate">
                      {isLoaded && fitStats.profileName
                        ? `${fitStats.profileName} • ${fitStats.totalMeasurements} kayıt`
                        : "Profil ölçümü"}
                    </span>
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <span className="text-xs font-bold text-foreground block">
                    {isLoaded && fitStats.latestWeight ? `${fitStats.latestWeight} kg` : "—"}
                  </span>
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                    {isLoaded && fitStats.latestBodyFat ? `%${fitStats.latestBodyFat} yağ` : "Ölçüm ekle"}
                  </span>
                </div>
              </Link>

              {/* Row 2: Wedding / Kumbara */}
              <Link
                href="/wedding"
                className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-background/60 hover:bg-surface-raised px-3.5 py-2.5 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <HeartRingIcon className="h-4 w-4 text-pink-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block truncate">
                      Düğün & Kumbara
                    </span>
                    <span className="text-[11px] text-muted block truncate">
                      {isLoaded
                        ? `${weddingStats.tamamlananSayisi}/${weddingStats.toplamMaddeSayisi} tamamlandı`
                        : "..."}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                  {isLoaded ? para(weddingStats.kalanKumbara) : "..."}
                </span>
              </Link>

              {/* Row 3: Wishlist */}
              <Link
                href="/wishlist"
                className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-background/60 hover:bg-surface-raised px-3.5 py-2.5 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GiftIcon className="h-4 w-4 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block truncate">
                      İstek Listesi
                    </span>
                    <span className="text-[11px] text-muted block truncate">
                      {isLoaded ? `${wishlistStats.completedCount} alınan ürün` : "..."}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300 tabular-nums whitespace-nowrap">
                  {isLoaded ? `${wishlistStats.pendingCount} Bekleyen` : "..."}
                </span>
              </Link>

              {/* Row 4: CarDo */}
              <Link
                href="/cardolist"
                className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-background/60 hover:bg-surface-raised px-3.5 py-2.5 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CarIcon className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block truncate">
                      Araç Masrafları
                    </span>
                    <span className="text-[11px] text-muted block truncate">
                      {isLoaded ? `Toplam ${cardoStats.count} kayıt` : "..."}
                    </span>
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <span className="text-xs font-bold text-foreground block">
                    {isLoaded ? para(cardoStats.total) : "..."}
                  </span>
                  {isLoaded && cardoStats.remaining > 0 && (
                    <span className="text-[11px] text-warning font-medium">
                      {para(cardoStats.remaining)} bekliyor
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
            <span className="text-muted truncate">Yerel & bulut senkron</span>
            <Link
              href="/gider"
              className="inline-flex min-h-[34px] items-center gap-1 py-1 font-medium text-primary hover:text-primary-hover shrink-0 whitespace-nowrap"
            >
              <span>Finansal Özet</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. ALL HOUSEHOLD MODULES (100% SYNCED WITH SIDEBAR ORDER) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Hane Modülleri
            </h2>
            <p className="text-xs text-muted">
              Menü sıralamanızla senkronize tüm ev yönetim uygulamaları
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("hane:open-sidebar-order"))}
            className="secondary-button min-h-[36px] px-3 py-1.5 text-xs shrink-0 whitespace-nowrap"
          >
            <ArrowUpDownIcon className="h-3.5 w-3.5 text-foreground-secondary" />
            <span>Sıralamayı Düzenle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {navItems.map((item) => renderAppCard(item))}
        </div>
      </section>
    </div>
  );
}
