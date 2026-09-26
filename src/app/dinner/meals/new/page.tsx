import Link from "next/link";
import { MealForm } from "@/components/dinner/MealForm";

export default function NewMealPage() {
  return (
    <section className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/dinner/meals" className="text-sm text-primary hover:underline">
          ← Yemeklere dön
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">Yeni yemek</h1>
        <p className="mt-1 text-sm text-muted">
          Yemek bilgilerini ve malzemelerini ekleyin.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <MealForm />
      </div>
    </section>
  );
}
