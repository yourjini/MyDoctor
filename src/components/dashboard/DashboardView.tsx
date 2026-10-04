"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type CalendarEvent } from "@/components/Calendar";
import { KindChip } from "@/components/KindChip";
import { SubjectBadge } from "@/components/SubjectBadge";
import { CollapsibleCalendar } from "./CollapsibleCalendar";
import { LanhaTodayCard, type LanhaSnapshot } from "./LanhaTodayCard";
import { QuickActions } from "./QuickActions";
import { matchesFilter, type Person } from "@/lib/people";

export type UpcomingAppointment = {
  id: string;
  datetime: string;
  hospitalName: string;
  reason?: string;
  subject?: string;
};

export type RecentRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  kind: "visit" | "appointment" | "checkup" | "health";
  title: string;
  subject?: string;
  href: string;
};

export function DashboardView({
  subject,
  snapshot,
  upcomingAppts,
  calendarEvents,
  recentRecords,
  todayKey,
}: {
  subject: Person;
  snapshot: LanhaSnapshot | null;
  upcomingAppts: UpcomingAppointment[];
  calendarEvents: CalendarEvent[];
  recentRecords: RecentRecord[];
  todayKey: string;
}) {
  const visibleAppts = useMemo(
    () =>
      upcomingAppts
        .filter((a) => matchesFilter(a.subject, subject))
        .slice(0, 4),
    [upcomingAppts, subject],
  );

  const visibleEvents = useMemo(
    () => calendarEvents.filter((e) => matchesFilter(e.subject, subject)),
    [calendarEvents, subject],
  );

  const visibleRecent = useMemo(
    () =>
      recentRecords
        .filter((r) => matchesFilter(r.subject, subject))
        .slice(0, 3),
    [recentRecords, subject],
  );

  const monthBadge = useMemo(() => {
    const ym = todayKey.slice(0, 7);
    const count = visibleEvents.filter((e) => e.date.startsWith(ym)).length;
    return `이번 달 ${count}건`;
  }, [visibleEvents, todayKey]);

  // 전체 뷰에는 특정 인물 전용 카드를 안 띄움. 란하만 선택했을 때 노출.
  const showLanha = subject === "박란하";

  return (
    <div className="space-y-5">
      {showLanha && snapshot && <LanhaTodayCard snap={snapshot} />}

      {visibleRecent.length > 0 && (
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">최근 등록</h2>
          </div>
          <ul className="space-y-1">
            {visibleRecent.map((r) => (
              <li key={`${r.kind}-${r.id}`}>
                <Link
                  href={r.href}
                  className="flex min-h-[44px] items-center gap-3 rounded p-2 text-sm hover:bg-accent"
                >
                  <SubjectBadge subject={r.subject} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <KindChip kind={r.kind} size="sm" />
                      <span className="truncate font-medium">{r.title}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {r.date}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">다가오는 일정</h2>
          <Link
            href="/appointments/new"
            className="inline-flex min-h-11 items-center rounded-md px-3 py-1.5 text-sm text-primary hover:bg-accent/60"
          >
            + 새 예약
          </Link>
        </div>
        {visibleAppts.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            예정된 일정이 없습니다.
          </p>
        ) : (
          <ul className="space-y-1">
            {visibleAppts.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/appointments/${item.datetime.slice(0, 4)}/${item.id}`}
                  className="flex min-h-[44px] items-center gap-3 rounded p-2 text-sm hover:bg-accent"
                >
                  <SubjectBadge subject={item.subject} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <KindChip kind="appointment" size="sm" />
                      <span className="truncate font-medium">
                        {item.hospitalName}
                      </span>
                    </div>
                    {item.reason && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.reason}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {formatKDateTime(item.datetime)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <QuickActions />

      <CollapsibleCalendar
        events={visibleEvents}
        defaultOpen={true}
        badge={monthBadge}
      />
    </div>
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
