import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { KindChip } from "@/components/KindChip";
import { getAppointment } from "@/lib/store";
import { AppointmentEditView } from "./AppointmentEditView";
import { StatusControl } from "./StatusControl";

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

      <StatusControl appt={appt} year={year} />

      <AppointmentEditView appt={appt} year={year} />
    </PageShell>
  );
}
