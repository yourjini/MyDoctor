import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getMeal } from "@/lib/store";
import { MealEditView } from "./MealEditView";

export const dynamic = "force-dynamic";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ year: string; month: string; id: string }>;
}) {
  const { year, month, id } = await params;
  const meal = await getMeal(year, month, id);
  if (!meal) notFound();
  return (
    <PageShell title="식사 기록">
      <MealEditView meal={meal} year={year} month={month} />
    </PageShell>
  );
}
