import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import { listAppointments } from "@/lib/store";
import { asPerson, matchesFilter } from "@/lib/people";
import { KIND_STYLES } from "@/lib/kinds";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const filter = asPerson(sp.subject);
  const all = (await listAppointments()).filter((a) =>
    matchesFilter(a.subject, filter),
  );
  const now = new Date();
  const upcoming = all.filter((a) => new Date(a.datetime) >= now);
  const past = all
    .filter((a) => new Date(a.datetime) < now)
    .sort((a, b) => b.datetime.localeCompare(a.datetime));

  return (
    <PageShell
      title="예약"
      action={
        <Link
          href="/appointments/new"
          className={cn(
            "inline-flex min-h-11 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            KIND_STYLES.appointment.solid,
          )}
        >
          + 새 예약
        </Link>
      }
    >
      <div className="mb-4">
        <SubjectFilter />
      </div>

      {all.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          예약된 일정이 없습니다.
        </p>
      ) : (
        <div className="space-y-6">
          <Section
            title="예정된 예약"
            items={upcoming}
            emptyMsg="다가오는 예약이 없습니다."
          />
          {past.length > 0 && <Section title="지난 예약" items={past} muted />}
        </div>
      )}
    </PageShell>
  );
}

function Section({
  title,
  items,
  emptyMsg,
  muted,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listAppointments>>;
  emptyMsg?: string;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          {emptyMsg}
        </p>
      ) : (
        <ul className="rounded-lg border bg-card divide-y">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/appointments/${a.datetime.slice(0, 4)}/${a.id}`}
                className={`flex items-start justify-between gap-3 p-4 hover:bg-accent/40 ${muted ? "opacity-70" : ""}`}
              >
                <SubjectBadge subject={a.subject} size="md" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {a.hospitalName}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground truncate">
                    {a.reason}
                  </div>
                </div>
                <div className="ml-1 shrink-0 text-right text-sm">
                  {formatKDT(a.datetime)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatKDT(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day} ${hh}:${min}`;
}
