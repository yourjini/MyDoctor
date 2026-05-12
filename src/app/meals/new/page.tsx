import { PageShell } from "@/components/PageShell";
import { MealForm } from "../MealForm";
import { createMealAction } from "../actions";
import { nextSlot } from "@/lib/meal-library";

export default async function NewMealPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const initialDate =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const initialSubject = sp.subject ?? "박란하";
  const initialSlot = nextSlot();

  return (
    <PageShell title="새 식사 기록">
      <MealForm
        action={createMealAction}
        initialDate={initialDate}
        initialSlot={initialSlot}
        initialSubject={initialSubject}
      />
    </PageShell>
  );
}
