"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WeekPlan } from "@/components/dinner/WeekPlan";
import { ShoppingList } from "@/components/dinner/ShoppingList";
import { MealReminderModal } from "@/components/dinner/MealReminderModal";
import { useLocalStorage } from "@/lib/local-storage/hooks";
import {
  STORAGE_KEYS,
  type LocalMeal,
  type LocalPlanEntry,
  type LocalShoppingItem,
} from "@/lib/local-storage/store";
import { addWeeks, getCurrentWeekStart, getDateForDay, getValidWeekStart } from "@/lib/date/week";
import { buildShoppingItems } from "@/services/local-shopping";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/types/common";
import {
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  UtensilsIcon,
  PlusIcon,
  ClockIcon,
} from "@/components/ui/Icons";
import { TodayMealBanner } from "@/components/dinner/TodayMealBanner";
import { PageHeader } from "@/components/ui/PageHeader";

const EMPTY_MEALS: LocalMeal[] = [];
const EMPTY_PLANS: Record<string, LocalPlanEntry[]> = {};
const EMPTY_SHOPPING: Record<string, LocalShoppingItem[]> = {};

function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function DinnerContent() {
  const searchParams = useSearchParams();
  const weekStart = getValidWeekStart(searchParams.get("week") ?? undefined);
  const isCurrentWeek = weekStart === getCurrentWeekStart();

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [meals, , mealsReady] = useLocalStorage(STORAGE_KEYS.meals, EMPTY_MEALS);
  const [plans, setPlans, plansReady] = useLocalStorage(STORAGE_KEYS.plans, EMPTY_PLANS);
  const [shoppingByWeek, setShoppingByWeek, shoppingReady] = useLocalStorage(
    STORAGE_KEYS.shopping,
    EMPTY_SHOPPING,
  );

  const assignments = useMemo(() => plans[weekStart] ?? [], [plans, weekStart]);
  const currentShopping = useMemo(
    () => shoppingByWeek[weekStart] ?? [],
    [shoppingByWeek, weekStart],
  );
  const ingredients = useMemo(
    () =>
      assignments.flatMap(
        (assignment) =>
          meals.find((meal) => meal.id === assignment.mealId)?.ingredients ?? [],
      ),
    [assignments, meals],
  );

  const plannedDaysCount = useMemo(() => {
    const daysSet = new Set(assignments.map((a) => a.dayOfWeek));
    return daysSet.size;
  }, [assignments]);

  const isShortcut = searchParams.get("shortcut") === "today";

  const todayDayOfWeek = useMemo<DayOfWeek>(() => {
    const jsDay = new Date().getDay();
    return (jsDay === 0 ? 7 : jsDay) as DayOfWeek;
  }, []);

  const todayAssignments = useMemo(() => {
    if (!isCurrentWeek) return [];
    return assignments.filter((a) => a.dayOfWeek === todayDayOfWeek);
  }, [assignments, todayDayOfWeek, isCurrentWeek]);

  const todayMeals = useMemo(() => {
    return todayAssignments
      .map((a) => meals.find((m) => m.id === a.mealId))
      .filter((m): m is LocalMeal => Boolean(m));
  }, [todayAssignments, meals]);

  useEffect(() => {
    if (isShortcut && mealsReady && plansReady) {
      const timer = setTimeout(() => {
        document.getElementById("day-card-today")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isShortcut, mealsReady, plansReady]);

  useEffect(() => {
    const nextShopping = buildShoppingItems(ingredients, currentShopping);
    if (JSON.stringify(nextShopping) !== JSON.stringify(currentShopping)) {
      setShoppingByWeek({ ...shoppingByWeek, [weekStart]: nextShopping });
    }
  }, [weekStart, ingredients, currentShopping, shoppingByWeek, setShoppingByWeek]);

  function assignMeal(day: DayOfWeek, mealId: string): void {
    if (
      assignments.some(
        (assignment) => assignment.dayOfWeek === day && assignment.mealId === mealId,
      )
    ) {
      return;
    }
    const nextAssignments = [...assignments, { dayOfWeek: day, mealId }];
    setPlans({ ...plans, [weekStart]: nextAssignments });
  }

  function changeMeal(day: DayOfWeek, index: number, mealId: string): void {
    const dayAssignments = assignments.filter((assignment) => assignment.dayOfWeek === day);
    if (
      dayAssignments.some(
        (assignment, itemIndex) => itemIndex !== index && assignment.mealId === mealId,
      )
    ) {
      return;
    }
    let currentIndex = -1;
    const nextAssignments = assignments.map((assignment) => {
      if (assignment.dayOfWeek !== day) return assignment;
      currentIndex += 1;
      return currentIndex === index ? { ...assignment, mealId } : assignment;
    });
    setPlans({ ...plans, [weekStart]: nextAssignments });
  }

  function removeMeal(day: DayOfWeek, index: number): void {
    let currentIndex = -1;
    setPlans({
      ...plans,
      [weekStart]: assignments.filter((assignment) => {
        if (assignment.dayOfWeek !== day) return true;
        currentIndex += 1;
        return currentIndex !== index;
      }),
    });
  }

  function fillDay(day: DayOfWeek): void {
    if (meals.length === 0) return;
    const randomMeal = meals[Math.floor(Math.random() * meals.length)];
    assignMeal(day, randomMeal.id);
  }

  function fillWeek(): void {
    if (meals.length === 0) return;
    const nextAssignments = DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day,
      mealId: meals[Math.floor(Math.random() * meals.length)].id,
    }));
    setPlans({ ...plans, [weekStart]: nextAssignments });
  }

  function toggleShoppingItem(key: string, isCompleted: boolean): void {
    setShoppingByWeek({
      ...shoppingByWeek,
      [weekStart]: currentShopping.map((item) =>
        item.key === key ? { ...item, isCompleted } : item,
      ),
    });
  }

  if (!mealsReady || !plansReady || !shoppingReady) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-[18px] bg-background-subtle" />
        <div className="h-96 animate-pulse rounded-[18px] bg-background-subtle" />
      </div>
    );
  }

  const weekEnd = getDateForDay(weekStart, 7);

  return (
    <div className="space-y-6 pb-8">
      {/* Unified Page Header + Week Selector */}
      <PageHeader
        icon={<UtensilsIcon className="h-5 w-5" />}
        badge={`${plannedDaysCount} / 7 Gün Planlı`}
        title="Hane Yemek Planı"
        subtitle="Haftalık akşam yemeği menünüzü oluşturun; gereken malzemeler alışveriş listenize otomatik eklensin."
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsReminderOpen(true)}
              className="secondary-button min-h-[38px] px-3 py-1.5 text-xs"
              title="Akşam yemeği bildirimi saatini ayarla"
            >
              <ClockIcon className="h-3.5 w-3.5 text-primary" />
              <span>Hatırlatıcı</span>
            </button>

            <button
              type="button"
              onClick={fillWeek}
              disabled={meals.length === 0}
              className="accent-button min-h-[38px] px-3.5 py-1.5 text-xs"
              title="Tüm haftaya rastgele yemekler ata"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-primary" />
              <span>Haftayı Doldur</span>
            </button>

            <Link
              href="/dinner/meals"
              className="secondary-button min-h-[38px] px-3.5 py-1.5 text-xs"
            >
              <UtensilsIcon className="h-3.5 w-3.5 text-foreground-secondary" />
              <span>Yemek Kataloğu ({meals.length})</span>
            </Link>

            <Link
              href="/dinner/meals/new"
              className="primary-button min-h-[38px] px-3.5 py-1.5 text-xs"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Yeni Tarif</span>
            </Link>
          </>
        }
      >
        <nav
          className="flex items-center justify-between gap-2"
          aria-label="Hafta navigasyonu"
        >
          <Link
            href={`/dinner?week=${addWeeks(weekStart, -1)}`}
            className="secondary-button min-h-[36px] px-3 py-1 text-xs"
            title="Önceki hafta"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Önceki Hafta</span>
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 text-center">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">
                {formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}
              </span>
            </div>
            {!isCurrentWeek ? (
              <Link
                href="/dinner"
                className="rounded-md bg-accent border border-border-lavender px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-accent-hover transition-colors"
              >
                Bu Haftaya Dön
              </Link>
            ) : (
              <span className="rounded-md bg-background border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
                Mevcut Hafta
              </span>
            )}
          </div>

          <Link
            href={`/dinner?week=${addWeeks(weekStart, 1)}`}
            className="secondary-button min-h-[36px] px-3 py-1 text-xs"
            title="Sonraki hafta"
          >
            <span className="hidden sm:inline">Sonraki Hafta</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </nav>
      </PageHeader>

      {/* Today's Meal Hero Banner */}
      {isCurrentWeek && (
        <TodayMealBanner
          todayMeals={todayMeals}
          todayDayOfWeek={todayDayOfWeek}
          onFillToday={() => fillDay(todayDayOfWeek)}
          onScrollToPlan={() => {
            document.getElementById("day-card-today")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          onOpenMealReminder={() => setIsReminderOpen(true)}
          isShortcutOpen={isShortcut}
        />
      )}

      {/* Main Weekly Plan Section */}
      <section className="space-y-4" aria-labelledby="weekly-plan-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2
              id="weekly-plan-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              7 Günlük Yemek Planı
            </h2>
            <p className="text-xs text-muted">
              Gün kartlarından yemek seçebilir, değiştirebilir veya birden fazla çeşit ekleyebilirsiniz
            </p>
          </div>
        </div>

        <WeekPlan
          weekStart={weekStart}
          meals={meals}
          assignments={assignments}
          onAssign={assignMeal}
          onChangeMeal={changeMeal}
          onRemove={removeMeal}
          onFillDay={fillDay}
        />
      </section>

      {/* Shopping List Section */}
      <ShoppingList items={currentShopping} onToggle={toggleShoppingItem} />

      {/* Meal Reminder Modal */}
      <MealReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />
    </div>
  );
}

export default function DinnerPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[18px] bg-background-subtle" />}>
      <DinnerContent />
    </Suspense>
  );
}
