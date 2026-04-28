import { PageShell } from "@/components/PageShell";
import { CheckupForm } from "./CheckupForm";

export default async function NewCheckupPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  return (
    <PageShell title="새 건강검진">
      <CheckupForm initialDate={initialDate} />
    </PageShell>
  );
}
