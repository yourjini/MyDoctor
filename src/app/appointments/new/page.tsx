import { PageShell } from "@/components/PageShell";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { createAppointmentAction } from "../actions";

export default function NewAppointmentPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <PageShell title="새 예약">
      <form
        action={createAppointmentAction}
        className="space-y-4 rounded-lg border bg-card p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="날짜" required>
            <input
              type="date"
              name="date"
              defaultValue={today}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="시간" required>
            <input
              type="time"
              name="time"
              defaultValue="09:00"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="병원 유형">
            <HospitalTypeSelect />
          </Field>
          <Field label="병원명" required>
            <input
              name="hospitalName"
              required
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

        <Field label="진료 목적">
          <input
            name="reason"
            placeholder="예: 정기검진, 추적관찰, 처방 갱신"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="주의사항">
          <textarea
            name="precautions"
            rows={3}
            placeholder="예: 8시간 금식 / 약 복용 중단 / 보험증 챙기기"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          저장
        </button>
      </form>
    </PageShell>
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
