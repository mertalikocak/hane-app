"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MealForm } from "@/components/dinner/MealForm";
import { useLocalStorage } from "@/lib/local-storage/hooks";
import { STORAGE_KEYS, type LocalMeal } from "@/lib/local-storage/store";
import { ChevronLeftIcon, UtensilsIcon } from "@/components/ui/Icons";

export default function EditMealPage() {
  const { id } = useParams<{ id: string }>();
  const [meals, , isReady] = useLocalStorage<LocalMeal[]>(STORAGE_KEYS.meals, []);
  const meal = meals.find((item) => item.id === id);

  if (!isReady) {
    return (
      <div
        className="mx-auto max-w-xl h-72 animate-pulse rounded-[18px] bg-background-subtle"
        aria-label="Yemek yükleniyor"
      />
    );
  }

  if (!meal) {
    return (
      <section className="mx-auto max-w-xl rounded-[18px] border border-border bg-surface p-8 text-center shadow-[var(--shadow-xs)]">
        <h1 className="text-lg font-semibold text-foreground">Yemek bulunamadı</h1>
        <p className="mt-1 text-xs text-muted">Aradığınız tarif silinmiş veya mevcut değil.</p>
        <Link href="/dinner/meals" className="primary-button mt-4 text-xs">
          Yemek Kataloğuna Dön
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl space-y-5 pb-8">
      <div className="rounded-[18px] border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent border border-border-lavender text-primary">
              <UtensilsIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Yemeği Düzenle
              </h1>
              <p className="text-xs text-muted">{meal.name}</p>
            </div>
          </div>

          <Link
            href="/dinner/meals"
            className="secondary-button min-h-[36px] px-3 py-1 text-xs"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            <span>Kataloğa Dön</span>
          </Link>
        </div>

        <MealForm
          mealId={meal.id}
          initialName={meal.name}
          initialDescription={meal.description}
          initialIngredients={meal.ingredients}
        />
      </div>
    </section>
  );
}
