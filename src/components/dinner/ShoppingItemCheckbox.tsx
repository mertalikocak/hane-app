"use client";

interface ShoppingItemCheckboxProps {
  isCompleted: boolean;
  onChange: (isCompleted: boolean) => void;
}

export function ShoppingItemCheckbox({
  isCompleted,
  onChange,
}: ShoppingItemCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={isCompleted}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4.5 w-4.5 rounded-lg border-border/80 text-primary accent-primary transition cursor-pointer"
      aria-label={isCompleted ? "Ürünü tamamlanmadı olarak işaretle" : "Ürünü tamamlandı olarak işaretle"}
    />
  );
}
