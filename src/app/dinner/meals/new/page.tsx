import Link from "next/link";
import { MealForm } from "@/components/dinner/MealForm";
import { ChevronLeftIcon, UtensilsIcon } from "@/components/ui/Icons";

export default function NewMealPage() {
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
                Yeni Yemek Tarifi
              </h1>
              <p className="text-xs text-muted">
                Yemek bilgilerini ve malzemelerini ekleyin
              </p>
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

        <MealForm />
      </div>
    </section>
  );
}
