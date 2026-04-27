import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { getAppointment } from "@/lib/store";
import {
  deleteAppointmentAction,
  updateAppointmentAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function AppointmentDetail({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const appt = await getAppointment(year, id);
  if (!appt) notFound();

  const date = appt.datetime.slice(0, 10);
  const time = appt.datetime.slice(11, 16);

  return (
    <PageShell title="예약 상세" action={<Link href="/appointments" className="text-sm text-muted-foreground hover:underline">← 목록</Link>}>
      <form action={updateAppointmentAction} className="space-y-4 rounded-lg border bg-card p-5">
        <input type="hidden" name="id" value={appt.id} />
        <input type="hidden" name="year" value={year} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="날짜">
            <input type="date" name="date" defaultValue={date} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="시간">
            <input type="time" name="time" defaultValue={time} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="병원 유형">
            <HospitalTypeSelect defaultValue={appt.hospitalType} />
          </Field>
          <Field label="병원명">
            <input name="hospitalName" defaultValue={appt.hospitalName} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </Field>
        </div>

        <Field label="의사 이름">
          <input name="doctorName" defaultValue={appt.doctorName ?? ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </Field>

        <Field label="진료 목적">
          <input name="reason" defaultValue={appt.reason ?? ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </Field>

        <Field label="주의사항">
          <textarea name="precautions" rows={3} defaultValue={appt.precautions ?? ""} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </Field>

        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          수정 저장
        </button>
      </form>

      <div className="mt-6 flex items-center justify-end">
        <form action={deleteAppointmentAction}>
          <input type="hidden" name="id" value={appt.id} />
          <input type="hidden" name="year" value={year} />
          <button type="submit" className="text-xs text-destructive hover:underline">
            삭제
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
