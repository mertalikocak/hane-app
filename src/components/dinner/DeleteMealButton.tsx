"use client";

import { useState } from "react";

interface DeleteMealButtonProps {
  mealName: string;
  onDelete: () => void;
}

export function DeleteMealButton({ mealName, onDelete }: DeleteMealButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDelete() {
    if (!window.confirm(`“${mealName}” yemeğini silmek istediğinize emin misiniz?`)) return;
    setIsSubmitting(true);
    onDelete();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isSubmitting}
      className="text-xs font-medium text-red-600 hover:text-red-700 transition"
    >
      {isSubmitting ? "Siliniyor..." : "Sil"}
    </button>
  );
}
