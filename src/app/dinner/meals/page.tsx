"use client";

import Link from "next/link";
import { DeleteMealButton } from "@/components/dinner/DeleteMealButton";
import { useLocalStorage } from "@/lib/local-storage/hooks";
import { STORAGE_KEYS, type LocalMeal } from "@/lib/local-storage/store";
import { PlusIcon, ChevronLeftIcon, UtensilsIcon } from "@/components/ui/Icons";

export default function MealsPage() {
  const [meals, setMeals, isReady] = useLocalStorage<LocalMeal[]>(STORAGE_KEYS.meals, []);

  function handleDelete(mealId: string): void {
    setMeals(meals.filter((meal) => meal.id !== mealId));
  }

  if (!isReady) {
    return (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-2xl bg-surface-raised" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-raised" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <Link
            href="/dinner"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" /> Haftalık Plana Dön
          </Link>
          <div className="mt-2 flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Yemek Kataloğu
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {meals.length} tarif
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Haftalık yemek planında kullanabileceğiniz tarifleri ve malzemeleri yönetin.
          </p>
        </div>
        <Link href="/dinner/meals/new" className="primary-button self-start sm:self-auto">
          <PlusIcon className="h-4 w-4" />
          <span>Yeni Yemek Ekle</span>
        </Link>
      </div>

      {meals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-surface/80 p-12 text-center shadow-xs">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <UtensilsIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-foreground">Henüz kayıtlı yemek yok</h2>
          <p className="mt-1 text-sm text-muted">
            Haftalık yemek planlamaya başlamak için ilk tarifinizi ekleyin.
          </p>
          <Link href="/dinner/meals/new" className="primary-button mt-5">
            <PlusIcon className="h-4 w-4" />
            <span>İlk Yemeği Ekle</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => (
            <article
              key={meal.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-foreground text-base tracking-tight">
                    {meal.name}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/dinner/meals/${meal.id}/edit`}
                      className="rounded-lg border border-border/60 bg-surface-raised px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      Düzenle
                    </Link>
                    <DeleteMealButton
                      mealName={meal.name}
                      onDelete={() => handleDelete(meal.id)}
                    />
                  </div>
                </div>

                {meal.description && (
                  <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">
                    {meal.description}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-border/40 pt-3">
                <p className="text-[11px] font-semibold text-muted mb-2">
                  Malzemeler ({meal.ingredients.length})
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {meal.ingredients.map((ingredient) => (
                    <span
                      key={ingredient.id}
                      className="rounded-lg bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-foreground/80 border border-border/40"
                    >
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
