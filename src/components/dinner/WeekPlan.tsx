"use client";

import Link from "next/link";
import { useState } from "react";
import { DAY_LABELS, DAYS_OF_WEEK, type DayOfWeek } from "@/types/common";
import { formatDate, getDateForDay } from "@/lib/date/week";
import type { LocalMeal, LocalPlanEntry } from "@/lib/local-storage/store";
import {
  DiceIcon,
  UtensilsIcon,
  PlusIcon,
  TrashIcon,
  InfoIcon,
  CloseIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

interface WeekPlanProps {
  weekStart: string;
  meals: LocalMeal[];
  assignments: LocalPlanEntry[];
  onAssign: (day: DayOfWeek, mealId: string) => void;
  onChangeMeal: (day: DayOfWeek, index: number, mealId: string) => void;
  onRemove: (day: DayOfWeek, index: number) => void;
  onFillDay: (day: DayOfWeek) => void;
}

export function WeekPlan({
  weekStart,
  meals,
  assignments,
  onAssign,
  onChangeMeal,
  onRemove,
  onFillDay,
}: WeekPlanProps) {
  const assignmentsByDay = new Map<number, LocalPlanEntry[]>();
  for (const assignment of assignments) {
    const current = assignmentsByDay.get(assignment.dayOfWeek) ?? [];
    assignmentsByDay.set(assignment.dayOfWeek, [...current, assignment]);
  }

  const todayStr = formatDate(new Date());

  return (
    <div className="space-y-4">
      {assignments.length === 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-accent/60 via-surface to-accent/40 p-4.5 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">
                Bu hafta henüz yemek planlamadın
              </p>
              <p className="text-xs text-muted sm:text-sm">
                Aşağıdaki günlerden dilediğinize yemek atayabilir veya üstteki &ldquo;Haftayı doldur&rdquo; ile tüm haftayı tek tıkla planlayabilirsiniz.
              </p>
            </div>
          </div>
          {meals.length === 0 ? (
            <Link
              href="/dinner/meals/new"
              className="primary-button shrink-0 text-xs sm:text-sm"
            >
              + İlk yemeğini ekle
            </Link>
          ) : (
            <Link
              href="/dinner/meals"
              className="secondary-button shrink-0 text-xs sm:text-sm"
            >
              Yemek Kataloğu
            </Link>
          )}
        </div>
      )}

      {/* 7 Columns on PC */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {DAYS_OF_WEEK.map((day) => {
          const date = getDateForDay(weekStart, day);
          return (
            <DayCard
              key={day}
              day={day}
              date={date}
              isToday={date === todayStr}
              meals={meals}
              assignments={assignmentsByDay.get(day) ?? []}
              onAssign={onAssign}
              onChangeMeal={onChangeMeal}
              onRemove={onRemove}
              onFillDay={onFillDay}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DayCardProps {
  day: DayOfWeek;
  date: string;
  isToday: boolean;
  meals: LocalMeal[];
  assignments: LocalPlanEntry[];
  onAssign: (day: DayOfWeek, mealId: string) => void;
  onChangeMeal: (day: DayOfWeek, index: number, mealId: string) => void;
  onRemove: (day: DayOfWeek, index: number) => void;
  onFillDay: (day: DayOfWeek) => void;
}

function DayCard({
  day,
  date,
  isToday,
  meals,
  assignments,
  onAssign,
  onChangeMeal,
  onRemove,
  onFillDay,
}: DayCardProps) {
  const [isSelectingMeal, setIsSelectingMeal] = useState(false);
  const [isAddingExtraMeal, setIsAddingExtraMeal] = useState(false);

  const assignedMeals = assignments
    .map((assignment) => meals.find((meal) => meal.id === assignment.mealId))
    .filter((meal): meal is LocalMeal => Boolean(meal));

  const dateObj = new Date(`${date}T00:00:00.000Z`);
  const dayOfMonth = dateObj.getUTCDate();
  const monthName = new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(dateObj);

  return (
    <article
      id={isToday ? "day-card-today" : `day-card-${day}`}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 ${
        isToday
          ? "border-primary/60 bg-surface shadow-md shadow-primary/5 ring-1 ring-primary/30"
          : "border-border/80 bg-surface shadow-xs hover:border-border hover:shadow-md"
      } p-3.5 sm:p-4`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold tracking-tight text-foreground text-sm sm:text-base">
                {DAY_LABELS[day]}
              </h3>
              {isToday && (
                <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  Bugün
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-medium text-muted">
              {dayOfMonth} {monthName}
            </p>
          </div>

          {/* Assigned dish count & Info tooltip */}
          <div className="flex items-center gap-1">
            {assignedMeals.length > 0 && (
              <div className="group/tooltip relative">
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent/80"
                  aria-label="Yemek malzemelerini göster"
                >
                  <InfoIcon className="h-3.5 w-3.5" />
                </button>
                <div
                  role="tooltip"
                  className="invisible absolute right-0 top-7 z-30 w-60 rounded-xl border border-border bg-surface-raised p-3 text-left opacity-0 shadow-xl transition-all group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100"
                >
                  <p className="border-b border-border/60 pb-1.5 text-xs font-bold text-foreground">
                    Günün Malzemeleri
                  </p>
                  <div className="mt-2 space-y-2.5 max-h-48 overflow-y-auto">
                    {assignedMeals.map((meal) => (
                      <div key={meal.id} className="space-y-1">
                        <p className="text-xs font-semibold text-primary">{meal.name}</p>
                        {meal.ingredients.length === 0 ? (
                          <p className="text-[11px] text-muted italic">Malzeme eklenmemiş</p>
                        ) : (
                          <ul className="space-y-0.5 text-[11px] text-muted">
                            {meal.ingredients.map((ing) => (
                              <li key={ing.id} className="flex justify-between">
                                <span>{ing.name}</span>
                                <span className="font-medium text-foreground/75">
                                  {ing.quantity} {ing.unit}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-3 space-y-2">
          {meals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-surface-raised/40 p-3 text-center">
              <p className="text-xs text-muted">Henüz kayıtlı yemek yok</p>
              <Link
                href="/dinner/meals/new"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Yemek ekle
              </Link>
            </div>
          ) : assignments.length === 0 ? (
            /* EMPTY DAY STATE */
            isSelectingMeal ? (
              /* Inline meal select when 'Yemek seç' is clicked */
              <div className="space-y-2 rounded-xl border border-primary/30 bg-accent/30 p-2.5 transition-all">
                <label
                  htmlFor={`select-meal-${day}`}
                  className="block text-[11px] font-semibold text-foreground/90"
                >
                  Yemek Seçin:
                </label>
                <select
                  id={`select-meal-${day}`}
                  defaultValue=""
                  autoFocus
                  onChange={(event) => {
                    if (event.target.value) {
                      onAssign(day, event.target.value);
                      setIsSelectingMeal(false);
                    }
                  }}
                  className="field text-xs py-1.5"
                >
                  <option value="" disabled>
                    Bir yemek seçin...
                  </option>
                  {meals.map((meal) => (
                    <option key={meal.id} value={meal.id}>
                      {meal.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsSelectingMeal(false)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-xs font-medium text-muted hover:bg-surface hover:text-foreground transition"
                >
                  <CloseIcon className="h-3 w-3" /> Vazgeç
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSelectingMeal(true)}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground border border-primary/20 transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
                    title="Menüden istediğin yemeği seç"
                  >
                    <UtensilsIcon className="h-3.5 w-3.5" />
                    <span>Yemek seç</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onFillDay(day)}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-surface-raised/60 px-2 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-surface-raised active:scale-[0.98]"
                    title="Rastgele bir yemek ata"
                  >
                    <DiceIcon className="h-3.5 w-3.5 text-muted" />
                    <span>Günü doldur</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* FILLED DAY STATE - Assignments list */
            <div className="space-y-2">
              {assignments.map((assignment, index) => {
                const currentMeal = meals.find((m) => m.id === assignment.mealId);
                return (
                  <div
                    key={`${assignment.mealId}-${index}`}
                    className="group/item relative rounded-xl border border-border/70 bg-surface-raised/70 p-2 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <select
                          id={`meal-${day}-${index}`}
                          value={assignment.mealId}
                          onChange={(e) => onChangeMeal(day, index, e.target.value)}
                          className="w-full truncate bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-primary rounded py-0.5"
                          title="Yemeği değiştirmek için seçin"
                        >
                          {meals.map((meal) => (
                            <option key={meal.id} value={meal.id} className="bg-surface text-foreground">
                              {meal.name}
                            </option>
                          ))}
                        </select>
                        {currentMeal?.ingredients && currentMeal.ingredients.length > 0 && (
                          <p className="truncate text-[10px] text-muted">
                            {currentMeal.ingredients.length} malzeme
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(day, index)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted/70 hover:bg-red-500/10 hover:text-red-500 transition"
                        aria-label="Yemeği kaldır"
                        title="Yemeği kaldır"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Extra meal selector */}
              {isAddingExtraMeal ? (
                <div className="space-y-1.5 rounded-xl border border-primary/30 bg-accent/30 p-2">
                  <select
                    id={`meal-${day}-new`}
                    defaultValue=""
                    autoFocus
                    onChange={(event) => {
                      if (event.target.value) {
                        onAssign(day, event.target.value);
                        setIsAddingExtraMeal(false);
                      }
                    }}
                    className="field text-xs py-1"
                  >
                    <option value="" disabled>
                      İkinci yemeği seçin...
                    </option>
                    {meals.map((meal) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingExtraMeal(false)}
                    className="flex w-full items-center justify-center gap-1 rounded py-0.5 text-[11px] font-medium text-muted hover:text-foreground"
                  >
                    <CloseIcon className="h-3 w-3" /> İptal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingExtraMeal(true)}
                  className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border/80 py-1.5 text-[11px] font-medium text-muted transition hover:border-primary/50 hover:bg-accent/30 hover:text-primary"
                  title="Güne başka yemek ekle"
                >
                  <PlusIcon className="h-3 w-3" />
                  <span>Yemek ekle</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
