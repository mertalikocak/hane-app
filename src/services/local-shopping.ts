import type { LocalIngredient, LocalShoppingItem } from "@/lib/local-storage/store";

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export function buildShoppingItems(
  ingredients: LocalIngredient[],
  previousItems: LocalShoppingItem[],
): LocalShoppingItem[] {
  const previousByKey = new Map(previousItems.map((item) => [item.key, item]));
  const grouped = new Map<string, LocalShoppingItem>();

  for (const ingredient of ingredients) {
    const key = `${normalizeName(ingredient.name)}::${ingredient.unit}`;
    const current = grouped.get(key);
    if (current) {
      current.quantity += ingredient.quantity;
      continue;
    }
    grouped.set(key, {
      key,
      ingredientName: ingredient.name.trim().replace(/\s+/g, " "),
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      isCompleted: previousByKey.get(key)?.isCompleted ?? false,
    });
  }

  return [...grouped.values()];
}
