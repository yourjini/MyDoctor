import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Calendar, type CalendarEvent } from "@/components/Calendar";
import { listAppointments, listVisits } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [visits, appts] = await Promise.all([
    listVisits(),
    listAppointments(),
  ]);

  const events: CalendarEvent[] = [
    ...visits.map((v) => ({
      id: v.id,
      date: v.date,
      title: `${v.hospitalName} · ${v.diagnosis}`,
      type: "visit" as const,
      href: `/visits/${v.date.slice(0, 4)}/${v.id}`,
    })),
    ...appts.map((a) => ({
      id: a.id,
      date: a.datetime.slice(0, 10),
      title: `${a.hospitalName}${a.reason ? ` · ${a.reason}` : ""}`,
      type: "appointment" as const,
      href: `/appointments/${a.datetime.slice(0, 4)}/${a.id}`,
    })),
  ];

  const upcoming = appts
    .filter((a) => new Date(a.datetime) >= new Date())
    .slice(0, 5);
  const recentVisits = visits.slice(0, 5);

  return (
    <PageShell title="캘린더">
      <Calendar events={events} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">다가오는 예약</h2>
            <Link
              href="/appointments/new"
              className="text-xs text-primary hover:underline"
            >
              + 새 예약
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              예약된 일정이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/appointments/${a.datetime.slice(0, 4)}/${a.id}`}
                    className="flex items-center justify-between rounded p-2 text-sm hover:bg-accent"
                  >
                    <div>
                      <div className="font-medium">{a.hospitalName}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.reason}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatKDateTime(a.datetime)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">최근 방문</h2>
            <Link
              href="/visits/new"
              className="text-xs text-primary hover:underline"
            >
              + 새 방문
            </Link>
          </div>
          {recentVisits.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              기록된 방문이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentVisits.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/visits/${v.date.slice(0, 4)}/${v.id}`}
                    className="flex items-center justify-between rounded p-2 text-sm hover:bg-accent"
                  >
                    <div>
                      <div className="font-medium">{v.hospitalName}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.diagnosis}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.date}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function formatKDateTime(iso: string): string {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${min}`;
}
