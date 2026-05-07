import { PageShell } from "@/components/PageShell";
import { todayKST } from "@/lib/utils";
import { createCycleAction } from "../actions";

const PERIOD_SUBJECTS = ["박란하", "최진희"] as const;

export default async function NewPeriodPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; start?: string }>;
}) {
  const sp = await searchParams;
  const subject =
    sp.subject && (PERIOD_SUBJECTS as readonly string[]).includes(sp.subject)
      ? sp.subject
      : "최진희";
  const today = todayKST().key;
  const initialStart = sp.start && /^\d{4}-\d{2}-\d{2}$/.test(sp.start) ? sp.start : today;

  return (
    <PageShell title="생리주기 수동 입력">
      <form
        action={createCycleAction}
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <Field label="대상자" required>
          <select
            name="subject"
            defaultValue={subject}
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
          <Field label="시작일" required>
            <input
              type="date"
              name="startDate"
              required
              defaultValue={initialStart}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="종료일 (선택)">
            <input
              type="date"
              name="endDate"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="양">
          <FlowRadios />
        </Field>

        <Field label="메모">
          <textarea
            name="notes"
            rows={3}
            placeholder="통증, 컨디션, 약 등"
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
    </PageShell>
  );
}

function FlowRadios({ defaultValue }: { defaultValue?: string } = {}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <FlowPill value="" label="—" defaultChecked={!defaultValue} />
      <FlowPill
        value="light"
        label="가벼움"
        defaultChecked={defaultValue === "light"}
      />
      <FlowPill
        value="normal"
        label="보통"
        defaultChecked={defaultValue === "normal"}
      />
      <FlowPill
        value="heavy"
        label="많음"
        defaultChecked={defaultValue === "heavy"}
      />
    </div>
  );
}

function FlowPill({
  value,
  label,
  defaultChecked,
}: {
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="flow"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-accent peer-checked:border-rose-500 peer-checked:bg-rose-500 peer-checked:text-white">
        {label}
      </span>
    </label>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
