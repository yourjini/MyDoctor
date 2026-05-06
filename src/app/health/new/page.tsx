import { PageShell } from "@/components/PageShell";
import { TagPicker } from "@/components/TagPicker";
import {
  BODY_TAG_GROUPS,
  MENSTRUATION_LABEL,
  MOOD_TAG_GROUPS,
  SEVERITY_LABEL,
} from "@/lib/health-tags";
import { createHealthLogAction } from "../actions";
import { BipolarAwareFields } from "../BipolarFields";

export default async function NewHealthLogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: queryDate } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = isValidDate(queryDate) ? queryDate! : today;

  return (
    <PageShell title="새 건강일지">
      <form
        action={createHealthLogAction}
        className="space-y-5 rounded-lg border bg-card p-4 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="날짜" required>
            <input
              type="date"
              name="date"
              defaultValue={initialDate}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="대상자" required>
            <BipolarAwareFields />
          </Field>
        </div>

        <Field label="컨디션 (전체)">
          <SeverityRadios />
        </Field>

        <Field label="아픈 곳 / 증상">
          <TagPicker
            name="bodyTags"
            groups={BODY_TAG_GROUPS}
            selectedClass="bg-rose-500 text-white border-rose-500"
          />
        </Field>

        <Field label="기분 / 심리">
          <TagPicker
            name="moodTags"
            groups={MOOD_TAG_GROUPS}
            selectedClass="bg-indigo-500 text-white border-indigo-500"
          />
        </Field>

        <Field label="생리">
          <MenstruationRadios />
        </Field>

        <Field label="메모">
          <textarea
            name="note"
            rows={3}
            placeholder="짧게 한줄도 좋아요"
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

function isValidDate(s?: string): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
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

function SeverityRadios({ defaultValue }: { defaultValue?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <RadioPill name="severity" value="" label="—" defaultChecked={!defaultValue} />
      {[1, 2, 3, 4, 5].map((n) => (
        <RadioPill
          key={n}
          name="severity"
          value={String(n)}
          label={`${n} ${SEVERITY_LABEL[n]}`}
          defaultChecked={defaultValue === n}
        />
      ))}
    </div>
  );
}

function MenstruationRadios({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <RadioPill
        name="menstruation"
        value=""
        label="해당없음"
        defaultChecked={!defaultValue}
      />
      {(["light", "normal", "heavy"] as const).map((v) => (
        <RadioPill
          key={v}
          name="menstruation"
          value={v}
          label={MENSTRUATION_LABEL[v]}
          defaultChecked={defaultValue === v}
        />
      ))}
    </div>
  );
}

function RadioPill({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
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
