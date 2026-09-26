"use client";

import Link from "next/link";
import { useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WeekPlan } from "@/components/dinner/WeekPlan";
import { ShoppingList } from "@/components/dinner/ShoppingList";
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
} from "@/components/ui/Icons";

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
        <div className="h-16 animate-pulse rounded-2xl bg-surface-raised" />
        <div className="h-96 animate-pulse rounded-2xl bg-surface-raised" />
      </div>
    );
  }

  const weekEnd = getDateForDay(weekStart, 7);

  return (
    <div className="space-y-8">
      {/* Top Week Navigation Bar */}
      <nav
        className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface/80 p-2 sm:p-3 shadow-xs backdrop-blur-sm"
        aria-label="Hafta navigasyonu"
      >
        <Link
          href={`/dinner?week=${addWeeks(weekStart, -1)}`}
          className="secondary-button h-9 px-3 text-xs sm:text-sm"
          title="Önceki hafta"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Önceki Hafta</span>
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              {formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}
            </h1>
          </div>
          {!isCurrentWeek ? (
            <Link
              href="/dinner"
              className="mt-0.5 text-xs font-semibold text-primary hover:underline"
            >
              Şimdiki Haftaya Dön
            </Link>
          ) : (
            <span className="mt-0.5 text-[11px] font-medium text-muted">
              Mevcut Hafta
            </span>
          )}
        </div>

        <Link
          href={`/dinner?week=${addWeeks(weekStart, 1)}`}
          className="secondary-button h-9 px-3 text-xs sm:text-sm"
          title="Sonraki hafta"
        >
          <span className="hidden sm:inline">Sonraki Hafta</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </nav>

      {/* Main Weekly Plan Section */}
      <section className="space-y-4" aria-labelledby="weekly-plan-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                  {plannedDaysCount} / 7 gün planlandı
                </span>
              </div>
              <h2
                id="weekly-plan-heading"
                className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
              >
                7 Günlük Yemek Planı
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fillWeek}
              disabled={meals.length === 0}
              className="primary-button text-xs sm:text-sm"
              title="Tüm haftaya rastgele yemekler ata"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Haftayı doldur</span>
            </button>

            <Link
              href="/dinner/meals"
              className="secondary-button text-xs sm:text-sm"
            >
              <UtensilsIcon className="h-4 w-4 text-muted" />
              <span>Yemekler ({meals.length})</span>
            </Link>
          </div>
        </div>

        {/* 7 Days Plan Component */}
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
      <div className="pt-2">
        <ShoppingList items={currentShopping} onToggle={toggleShoppingItem} />
      </div>
    </div>
  );
}

export default function DinnerPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-raised" />}>
      <DinnerContent />
    </Suspense>
  );
}
