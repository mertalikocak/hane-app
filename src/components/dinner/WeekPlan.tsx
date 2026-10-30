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
        <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-[var(--shadow-xs)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent border border-border-lavender text-primary">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Bu hafta henüz yemek planlanmadı
              </p>
              <p className="text-xs text-foreground-secondary">
                Aşağıdaki günlerden dilediğinize yemek atayabilir veya üstteki &ldquo;Haftayı Doldur&rdquo; ile tüm haftayı tek tıkla planlayabilirsiniz.
              </p>
            </div>
          </div>
          {meals.length === 0 ? (
            <Link
              href="/dinner/meals/new"
              className="primary-button shrink-0 text-xs whitespace-nowrap"
            >
              + İlk Yemeği Ekle
            </Link>
          ) : (
            <Link
              href="/dinner/meals"
              className="secondary-button shrink-0 text-xs whitespace-nowrap"
            >
              Yemek Kataloğu
            </Link>
          )}
        </div>
      )}

      {/* Responsive Day Grid: Spacious cards across Mobile, Tablet & Desktop */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      className={`group relative flex flex-col justify-between rounded-[14px] border transition-colors duration-150 p-4 ${
        isToday
          ? "border-primary bg-surface-lavender/60 shadow-[var(--shadow-sm)] ring-1 ring-primary/20"
          : "border-border bg-surface shadow-[var(--shadow-xs)] hover:border-border-strong"
      }`}
    >
      <div>
        {/* Day Header */}
        <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold tracking-tight text-foreground text-sm sm:text-base">
                {DAY_LABELS[day]}
              </h3>
              {isToday && (
                <span className="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                  Bugün
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-medium text-muted tabular-nums">
              {dayOfMonth} {monthName}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {assignedMeals.length > 0 && (
              <div className="group/tooltip relative">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent border border-border-lavender text-primary transition-colors hover:bg-accent-hover cursor-pointer"
                  aria-label="Yemek malzemelerini göster"
                >
                  <InfoIcon className="h-3.5 w-3.5" />
                </button>
                <div
                  role="tooltip"
                  className="invisible absolute right-0 top-8 z-30 w-60 rounded-[14px] border border-border-strong bg-surface p-3 text-left opacity-0 shadow-[var(--shadow-md)] transition-all group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100"
                >
                  <p className="border-b border-border pb-1.5 text-xs font-semibold text-foreground">
                    Günün Malzemeleri
                  </p>
                  <div className="mt-2 space-y-2.5 max-h-48 overflow-y-auto">
                    {assignedMeals.map((meal) => (
                      <div key={meal.id} className="space-y-1">
                        <p className="text-xs font-semibold text-primary">{meal.name}</p>
                        {meal.ingredients.length === 0 ? (
                          <p className="text-[11px] text-muted italic">Malzeme eklenmemiş</p>
                        ) : (
                          <ul className="space-y-0.5 text-[11px] text-foreground-secondary">
                            {meal.ingredients.map((ing) => (
                              <li key={ing.id} className="flex justify-between gap-2">
                                <span>{ing.name}</span>
                                <span className="font-semibold text-foreground tabular-nums">
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

        {/* Day Body */}
        <div className="mt-3 space-y-2">
          {meals.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-border-strong bg-background/60 p-3.5 text-center">
              <p className="text-xs text-muted">Henüz kayıtlı yemek yok</p>
              <Link
                href="/dinner/meals/new"
                className="mt-2 inline-flex min-h-[34px] items-center gap-1 px-2 py-1 text-xs font-semibold text-primary hover:underline"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Yemek ekle
              </Link>
            </div>
          ) : assignments.length === 0 ? (
            isSelectingMeal ? (
              <div className="space-y-2 rounded-[10px] border border-border-lavender bg-surface-lavender p-3">
                <label
                  htmlFor={`select-meal-${day}`}
                  className="block text-xs font-semibold text-foreground"
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
                  className="field min-h-[38px] text-xs py-1.5"
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
                  className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
                >
                  <CloseIcon className="h-3 w-3" /> Vazgeç
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSelectingMeal(true)}
                  className="accent-button min-h-[38px] px-2.5 py-1.5 text-xs"
                  title="Menüden istediğin yemeği seç"
                >
                  <UtensilsIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Yemek Seç</span>
                </button>

                <button
                  type="button"
                  onClick={() => onFillDay(day)}
                  className="secondary-button min-h-[38px] px-2.5 py-1.5 text-xs"
                  title="Rastgele bir yemek ata"
                >
                  <DiceIcon className="h-3.5 w-3.5 text-muted shrink-0" />
                  <span>Rastgele</span>
                </button>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment, index) => {
                const currentMeal = meals.find((m) => m.id === assignment.mealId);
                return (
                  <div
                    key={`${assignment.mealId}-${index}`}
                    className="rounded-[10px] border border-border bg-background/70 p-2.5 transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-center justify-between gap-2">
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
                          <p className="truncate text-[11px] text-muted mt-0.5">
                            {currentMeal.ingredients.length} malzeme
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(day, index)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-bg hover:text-danger transition-colors cursor-pointer"
                        aria-label="Yemeği kaldır"
                        title="Yemeği kaldır"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {isAddingExtraMeal ? (
                <div className="space-y-1.5 rounded-[10px] border border-border-lavender bg-surface-lavender p-2.5">
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
                    className="field min-h-[36px] text-xs py-1"
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
                    className="flex w-full items-center justify-center gap-1 rounded py-1 text-xs font-medium text-muted hover:text-foreground cursor-pointer"
                  >
                    <CloseIcon className="h-3 w-3" /> İptal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingExtraMeal(true)}
                  className="flex w-full items-center justify-center gap-1 rounded-[10px] border border-dashed border-border-strong py-2 text-xs font-medium text-foreground-secondary transition-colors hover:border-primary hover:bg-surface-lavender hover:text-primary cursor-pointer"
                  title="Güne başka yemek ekle"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>Ek Yemek Ekle</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
