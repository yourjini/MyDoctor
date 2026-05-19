import { PageShell } from "@/components/PageShell";
import { listHealthLogs } from "@/lib/store";
import { createHealthLogAction } from "../actions";
import { HealthLogFormBody } from "../HealthLogFormBody";

export default async function NewHealthLogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: queryDate } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = isValidDate(queryDate) ? queryDate! : today;

  const healthLogs = await listHealthLogs();
  const latestBipolarWeight = healthLogs
    .filter((l) => (l.subject ?? "전체") === "박란하" && l.weight != null)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weight;

  return (
    <PageShell title="새 건강일지">
      <form
        action={createHealthLogAction}
        className="space-y-5 rounded-lg border bg-card p-4 sm:p-5"
      >
        <HealthLogFormBody
          defaultDate={initialDate}
          latestBipolarWeight={latestBipolarWeight}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
          >
            저장
          </button>
        </div>
      </form>
    </PageShell>
  );
}

function isValidDate(s?: string): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
