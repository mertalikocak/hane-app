"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteMealButton } from "@/components/dinner/DeleteMealButton";
import { useLocalStorage } from "@/lib/local-storage/hooks";
import { STORAGE_KEYS, type LocalMeal } from "@/lib/local-storage/store";
import { PlusIcon, ChevronLeftIcon, UtensilsIcon } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageHeader";

export default function MealsPage() {
  const [meals, setMeals, isReady] = useLocalStorage<LocalMeal[]>(STORAGE_KEYS.meals, []);
  const [searchQuery, setSearchQuery] = useState("");

  function handleDelete(mealId: string): void {
    setMeals(meals.filter((meal) => meal.id !== mealId));
  }

  if (!isReady) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[18px] bg-background-subtle" />
        <div className="h-64 animate-pulse rounded-[18px] bg-background-subtle" />
      </div>
    );
  }

  const filteredMeals = meals.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    if (m.name.toLowerCase().includes(q)) return true;
    if (m.description?.toLowerCase().includes(q)) return true;
    return m.ingredients.some((i) => i.name.toLowerCase().includes(q));
  });

  return (
    <section className="space-y-6 pb-8">
      <PageHeader
        icon={<UtensilsIcon className="h-5 w-5" />}
        badge={`${meals.length} Tarif`}
        title="Yemek Kataloğu"
        subtitle="Haftalık yemek planında kullanabileceğiniz tarifleri ve malzemeleri yönetin."
        actions={
          <>
            <Link href="/dinner" className="secondary-button min-h-[38px] px-3.5 py-1.5 text-xs">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              <span>Haftalık Plana Dön</span>
            </Link>
            <Link href="/dinner/meals/new" className="primary-button min-h-[38px] px-3.5 py-1.5 text-xs">
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Yeni Yemek Ekle</span>
            </Link>
          </>
        }
      >
        {meals.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tarif adı veya malzeme ile ara..."
              className="field max-w-md min-h-[38px] text-xs"
            />
            <span className="text-xs font-medium text-muted">
              {filteredMeals.length} tarif görüntüleniyor
            </span>
          </div>
        )}
      </PageHeader>

      {meals.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-border-strong bg-surface p-10 text-center shadow-[var(--shadow-xs)]">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent border border-border-lavender text-primary">
            <UtensilsIcon className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            Henüz kayıtlı yemek yok
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-foreground-secondary max-w-md mx-auto">
            Haftalık yemek planlamaya başlamak için ilk tarifinizi ve malzemelerini ekleyin.
          </p>
          <Link href="/dinner/meals/new" className="primary-button mt-5 text-xs">
            <PlusIcon className="h-4 w-4" />
            <span>İlk Yemeği Ekle</span>
          </Link>
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border-strong bg-surface p-8 text-center">
          <p className="text-sm font-medium text-foreground-secondary">
            Aramanızla eşleşen tarif bulunamadı.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="secondary-button mt-3 text-xs min-h-[36px] px-3 py-1"
          >
            Aramayı Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMeals.map((meal) => (
            <article
              key={meal.id}
              className="ds-card-interactive flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-foreground text-base tracking-tight">
                    {meal.name}
                  </h2>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href={`/dinner/meals/${meal.id}/edit`}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-surface-lavender hover:text-primary"
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
                  <p className="mt-2 text-xs text-foreground-secondary leading-relaxed line-clamp-2">
                    {meal.description}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                  Malzemeler ({meal.ingredients.length})
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {meal.ingredients.map((ingredient) => (
                    <span
                      key={ingredient.id}
                      className="rounded-lg bg-background px-2.5 py-0.5 text-xs font-medium text-foreground border border-border tabular-nums"
                    >
                      <strong className="font-semibold text-primary">
                        {ingredient.quantity} {ingredient.unit}
                      </strong>{" "}
                      {ingredient.name}
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
