"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createId,
  readStorage,
  STORAGE_KEYS,
  writeStorage,
  type LocalMeal,
} from "@/lib/local-storage/store";
import type { MeasurementUnit } from "@/types/common";

const UNITS: readonly MeasurementUnit[] = [
  "gram",
  "kilogram",
  "ml",
  "litre",
  "adet",
  "yemek kaşığı",
  "çay kaşığı",
  "paket",
  "kutu",
  "demet",
];

interface InitialIngredient {
  name: string;
  quantity: number;
  unit: MeasurementUnit;
}

interface MealFormProps {
  mealId?: string;
  initialName?: string;
  initialDescription?: string;
  initialIngredients?: InitialIngredient[];
}

export function MealForm({
  mealId,
  initialName = "",
  initialDescription = "",
  initialIngredients = [],
}: MealFormProps) {
  const [ingredients, setIngredients] = useState<InitialIngredient[]>(
    initialIngredients.length > 0
      ? initialIngredients
      : [{ name: "", quantity: 1, unit: "gram" }],
  );
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formName = (event.currentTarget.elements.namedItem("name") as HTMLInputElement).value.trim();
    const cleanIngredients = ingredients.map((ingredient) => ({
      ...ingredient,
      name: ingredient.name.trim(),
    }));
    if (!formName) {
      setError("Yemek adı zorunludur.");
      return;
    }
    if (cleanIngredients.some((ingredient) => !ingredient.name)) {
      setError("Malzeme adı zorunludur.");
      return;
    }
    if (cleanIngredients.some((ingredient) => ingredient.quantity <= 0)) {
      setError("Miktar pozitif olmalıdır.");
      return;
    }
    const now = new Date().toISOString();
    const meals = readStorage<LocalMeal[]>(STORAGE_KEYS.meals, []);
    const meal: LocalMeal = {
      id: mealId ?? createId(),
      name: formName,
      description: (event.currentTarget.elements.namedItem("description") as HTMLTextAreaElement).value.trim(),
      ingredients: cleanIngredients.map((ingredient) => ({ ...ingredient, id: createId() })),
      createdAt: meals.find((item) => item.id === mealId)?.createdAt ?? now,
      updatedAt: now,
    };
    writeStorage(
      STORAGE_KEYS.meals,
      mealId ? meals.map((item) => (item.id === mealId ? meal : item)) : [...meals, meal],
    );
    router.push("/dinner/meals");
    router.refresh();
  }

  function updateIngredient(
    index: number,
    field: keyof InitialIngredient,
    value: string,
  ) {
    setIngredients((current) =>
      current.map((ingredient, ingredientIndex) => {
        if (ingredientIndex !== index) return ingredient;
        if (field === "quantity") return { ...ingredient, quantity: Number(value) };
        if (field === "unit") {
          return { ...ingredient, unit: value as MeasurementUnit };
        }
        return { ...ingredient, name: value };
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {mealId && <input type="hidden" name="id" value={mealId} />}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Yemek adı
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initialName}
          placeholder="Örn. Tavuklu Makarna"
          className="field"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Açıklama <span className="text-muted">(isteğe bağlı)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialDescription}
          placeholder="Yemek hakkında kısa bir not"
          className="field resize-y"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Malzemeler</legend>
        <input
          type="hidden"
          name="ingredients"
          value={JSON.stringify(ingredients)}
          readOnly
        />
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="rounded-xl border border-border p-3">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  required
                  aria-label={`Malzeme ${index + 1}`}
                  value={ingredient.name}
                  onChange={(event) => updateIngredient(index, "name", event.target.value)}
                  placeholder="Malzeme adı"
                  className="field"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIngredients((current) =>
                      current.filter((_, ingredientIndex) => ingredientIndex !== index),
                    )
                  }
                  disabled={ingredients.length === 1}
                  className="icon-button"
                  aria-label="Malzemeyi sil"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  required
                  min="0.001"
                  step="any"
                  type="number"
                  aria-label={`Malzeme ${index + 1} miktarı`}
                  value={ingredient.quantity}
                  onChange={(event) =>
                    updateIngredient(index, "quantity", event.target.value)
                  }
                  placeholder="Miktar"
                  className="field"
                />
                <select
                  required
                  aria-label={`Malzeme ${index + 1} birimi`}
                  value={ingredient.unit}
                  onChange={(event) => updateIngredient(index, "unit", event.target.value)}
                  className="field"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setIngredients((current) => [
              ...current,
              { name: "", quantity: 1, unit: "gram" },
            ])
          }
          className="secondary-button w-full"
        >
          + Malzeme ekle
        </button>
      </fieldset>

      <button type="submit" className="primary-button w-full">
        {mealId ? "Değişiklikleri kaydet" : "Yemeği kaydet"}
      </button>
    </form>
  );
}
