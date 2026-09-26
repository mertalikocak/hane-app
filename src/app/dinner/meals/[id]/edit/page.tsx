"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MealForm } from "@/components/dinner/MealForm";
import { useLocalStorage } from "@/lib/local-storage/hooks";
import { STORAGE_KEYS, type LocalMeal } from "@/lib/local-storage/store";

export default function EditMealPage() {
  const { id } = useParams<{ id: string }>();
  const [meals, , isReady] = useLocalStorage<LocalMeal[]>(STORAGE_KEYS.meals, []);
  const meal = meals.find((item) => item.id === id);

  if (!isReady) {
    return <div className="h-72 animate-pulse rounded-2xl bg-border/50" aria-label="Yemek yükleniyor" />;
  }
  if (!meal) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="text-xl font-semibold">Yemek bulunamadı</h1>
        <Link href="/dinner/meals" className="primary-button mt-4">Yemeklere dön</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/dinner/meals" className="text-sm text-primary hover:underline">← Yemeklere dön</Link>
        <h1 className="mt-3 text-2xl font-semibold">Yemeği düzenle</h1>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
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
