import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { KindChip } from "@/components/KindChip";
import { getAppointment } from "@/lib/store";
import { deleteAppointmentAction } from "../../actions";
import { AppointmentEditView } from "./AppointmentEditView";

export const dynamic = "force-dynamic";

export default async function AppointmentDetail({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const appt = await getAppointment(year, id);
  if (!appt) notFound();

  return (
    <PageShell
      title="예약 상세"
      action={
        <Link
          href="/appointments"
          className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <div className="mb-3">
        <KindChip kind="appointment" />
      </div>

      <AppointmentEditView appt={appt} year={year} />

      <div className="mt-6 flex items-center justify-end">
        <form action={deleteAppointmentAction}>
          <input type="hidden" name="id" value={appt.id} />
          <input type="hidden" name="year" value={year} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center px-2 text-xs text-destructive hover:underline"
          >
            삭제
          </button>
        </form>
      </div>
    </PageShell>
  );
}
