import { PageShell } from "@/components/PageShell";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { FilePicker } from "@/components/FilePicker";
import { createVisitAction } from "../actions";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: queryDate } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = isValidDate(queryDate) ? queryDate! : today;
  return (
    <PageShell title="새 방문 기록">
      <form
        action={createVisitAction}
        encType="multipart/form-data"
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <Field label="방문일" required>
          <input
            type="date"
            name="date"
            defaultValue={initialDate}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="병원 유형" required>
            <HospitalTypeSelect />
          </Field>
          <Field label="병원명" required>
            <input
              name="hospitalName"
              required
              placeholder="○○병원"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="의사 이름 (선택)">
          <input
            name="doctorName"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="병명 / 진단" required>
          <input
            name="diagnosis"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="상세 내용">
          <textarea
            name="details"
            rows={4}
            placeholder="처방, 검사 결과, 다음 진료 안내 등"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="첨부파일 (영수증, 처방전 등)">
          <FilePicker name="files" />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="insuranceClaimed" className="h-4 w-4" />
          실비보험 청구 완료
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
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
