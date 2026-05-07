import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getMenstrualCycle } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { deleteCycleAction, updateCycleAction } from "../../actions";

const PERIOD_SUBJECTS = ["박란하", "최진희"] as const;

export const dynamic = "force-dynamic";

export default async function PeriodDetailPage({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const cycle = await getMenstrualCycle(year, id);
  if (!cycle) notFound();

  return (
    <PageShell
      title="생리주기 수정"
      action={
        <Link
          href="/period"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <form
        action={updateCycleAction}
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <input type="hidden" name="id" value={cycle.id} />
        <input type="hidden" name="year" value={year} />

        <Field label="대상자">
          <select
            name="subject"
            defaultValue={cycle.subject}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {PERIOD_SUBJECTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="시작일">
            <input
              type="date"
              name="startDate"
              required
              defaultValue={cycle.startDate}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="종료일">
            <input
              type="date"
              name="endDate"
              defaultValue={cycle.endDate ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="양">
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: "", l: "—" },
              { v: "light", l: "가벼움" },
              { v: "normal", l: "보통" },
              { v: "heavy", l: "많음" },
            ].map((opt) => (
              <label key={opt.v} className="cursor-pointer">
                <input
                  type="radio"
                  name="flow"
                  value={opt.v}
                  defaultChecked={(cycle.flow ?? "") === opt.v}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-accent peer-checked:border-rose-500 peer-checked:bg-rose-500 peer-checked:text-white">
                  {opt.l}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="메모">
          <textarea
            name="notes"
            rows={3}
            defaultValue={cycle.notes ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            저장
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div>
          기록 생성: {formatDate(cycle.createdAt, true)}
          {cycle.updatedAt !== cycle.createdAt && (
            <> · 마지막 수정: {formatDate(cycle.updatedAt, true)}</>
          )}
        </div>
        <form action={deleteCycleAction}>
          <input type="hidden" name="id" value={cycle.id} />
          <input type="hidden" name="year" value={year} />
          <button type="submit" className="rounded text-destructive hover:underline">
            삭제
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
