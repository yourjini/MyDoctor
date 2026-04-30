import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Calendar, type CalendarEvent } from "@/components/Calendar";
import { KindChip } from "@/components/KindChip";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import { listAppointments, listVisits } from "@/lib/store";
import { asPerson, matchesFilter } from "@/lib/people";
import { todayKST } from "@/lib/utils";

export const dynamic = "force-dynamic";

type UpcomingItem =
  | {
      kind: "appointment";
      id: string;
      sortKey: string;
      datetime: string;
      hospitalName: string;
      reason?: string;
      subject?: string;
      href: string;
    }
  | {
      kind: "visit";
      id: string;
      sortKey: string;
      date: string;
      hospitalName: string;
      diagnosis: string;
      subject?: string;
      href: string;
    };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const filter = asPerson(sp.subject);

  const [allVisits, allAppts] = await Promise.all([
    listVisits(),
    listAppointments(),
  ]);
  const visits = allVisits.filter((v) => matchesFilter(v.subject, filter));
  const appts = allAppts.filter((a) => matchesFilter(a.subject, filter));

  const events: CalendarEvent[] = [
    ...visits.map((v) => ({
      id: v.id,
      date: v.date,
      title: `${v.hospitalName} · ${v.diagnosis}`,
      type: "visit" as const,
      subject: v.subject,
      href: `/visits/${v.date.slice(0, 4)}/${v.id}`,
    })),
    ...appts.map((a) => ({
      id: a.id,
      date: a.datetime.slice(0, 10),
      title: `${a.hospitalName}${a.reason ? ` · ${a.reason}` : ""}`,
      type: "appointment" as const,
      subject: a.subject,
      href: `/appointments/${a.datetime.slice(0, 4)}/${a.id}`,
    })),
  ];

  // Visits are recorded after the fact, so a visit dated today belongs in
  // "최근 방문". Only strictly future-dated visits (pre-created entries
  // like a recurring weekly therapy session) belong in the upcoming list.
  const todayKey = todayKST().key;
  const futureVisits = visits.filter((v) => v.date > todayKey);
  const pastVisits = visits.filter((v) => v.date <= todayKey);

  const now = new Date();
  const futureAppts = appts.filter((a) => new Date(a.datetime) >= now);

  const upcoming: UpcomingItem[] = [
    ...futureAppts.map((a) => ({
      kind: "appointment" as const,
      id: a.id,
      sortKey: a.datetime,
      datetime: a.datetime,
      hospitalName: a.hospitalName,
      reason: a.reason,
      subject: a.subject,
      href: `/appointments/${a.datetime.slice(0, 4)}/${a.id}`,
    })),
    ...futureVisits.map((v) => ({
      kind: "visit" as const,
      id: v.id,
      sortKey: v.date,
      date: v.date,
      hospitalName: v.hospitalName,
      diagnosis: v.diagnosis,
      subject: v.subject,
      href: `/visits/${v.date.slice(0, 4)}/${v.id}`,
    })),
  ]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(0, 5);

  const recentVisits = pastVisits.slice(0, 5);

  return (
    <PageShell title="캘린더">
      <div className="mb-3">
        <SubjectFilter />
      </div>

      <Calendar events={events} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">다가오는 일정</h2>
            <Link
              href="/appointments/new"
              className="text-xs text-primary hover:underline"
            >
              + 새 예약
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              예정된 일정이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded p-2 text-sm hover:bg-accent"
                  >
                    <SubjectBadge subject={item.subject} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <KindChip kind={item.kind} size="sm" />
                        <span className="truncate font-medium">
                          {item.hospitalName}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground truncate">
                        {item.kind === "appointment"
                          ? item.reason
                          : item.diagnosis}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {item.kind === "appointment"
                        ? formatKDateTime(item.datetime)
                        : formatKDate(item.date)}
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
                    className="flex items-center gap-3 rounded p-2 text-sm hover:bg-accent"
                  >
                    <SubjectBadge subject={v.subject} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{v.hospitalName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {v.diagnosis}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
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

function formatKDate(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${Number(m)}/${Number(d)}`;
}
