import { PageShell } from "@/components/PageShell";
import { VisitForm } from "./VisitForm";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: queryDate } = await searchParams;
  const initialDate = isValidDate(queryDate) ? queryDate : undefined;
  return (
    <PageShell title="새 방문 기록">
      <VisitForm initialDate={initialDate} />
    </PageShell>
  );
}

function isValidDate(s?: string): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
