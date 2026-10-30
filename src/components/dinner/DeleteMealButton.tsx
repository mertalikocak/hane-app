"use client";

import { useState } from "react";

interface DeleteMealButtonProps {
  mealName: string;
  onDelete: () => void;
}

export function DeleteMealButton({ mealName, onDelete }: DeleteMealButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div className="inline-flex items-center gap-1 rounded-lg border border-danger-border bg-danger-bg px-2 py-0.5">
        <button
          type="button"
          onClick={() => {
            setIsConfirming(false);
            onDelete();
          }}
          className="text-[11px] font-semibold text-danger hover:underline cursor-pointer"
          aria-label={`${mealName} yemeğini silmeyi onayla`}
        >
          Sil
        </button>
        <span className="text-danger/40 text-[10px]">|</span>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          className="text-[11px] font-medium text-foreground-secondary hover:text-foreground cursor-pointer"
        >
          Vazgeç
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsConfirming(true)}
      className="rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-danger hover:border-danger-border hover:bg-danger-bg transition-colors cursor-pointer"
    >
      Sil
    </button>
  );
}
