"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KindChip } from "@/components/KindChip";
import { SubjectBadge } from "@/components/SubjectBadge";
import { LanhaTodayCard, type LanhaSnapshot } from "./LanhaTodayCard";
import { QuickActions } from "./QuickActions";
import { PEOPLE, PERSON_COLORS, asPerson, matchesFilter, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";

export type UpcomingAppointment = {
  id: string;
  datetime: string;
  hospitalName: string;
  reason?: string;
  subject?: string;
};

export function DashboardView({
  initialSubject,
  snapshot,
  upcomingAppts,
}: {
  initialSubject: Person;
  snapshot: LanhaSnapshot | null;
  upcomingAppts: UpcomingAppointment[];
}) {
  const [subject, setSubject] = useState<Person>(initialSubject);

  const visibleAppts = useMemo(
    () =>
      upcomingAppts
        .filter((a) => matchesFilter(a.subject, subject))
        .slice(0, 4),
    [upcomingAppts, subject],
  );

  const showLanha = subject === "전체" || subject === "박란하";

  return (
    <>
      <div className="mb-3">
        <ClientSubjectFilter current={subject} onChange={setSubject} />
      </div>

      <div className="space-y-4">
        {showLanha && snapshot && <LanhaTodayCard snap={snapshot} />}

        <QuickActions />

        <section className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">다가오는 일정</h2>
            <Link
              href="/appointments/new"
              className="rounded-md px-2 py-1 text-xs text-primary hover:bg-accent/60"
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

        <Sitemap />
      </div>
    </>
  );
}

function ClientSubjectFilter({
  current,
  onChange,
}: {
  current: Person;
  onChange: (p: Person) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="대상자 필터">
      {PEOPLE.map((p) => {
        const active = current === p;
        const colors = PERSON_COLORS[p];
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(asPerson(p))}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active ? colors.pillActive : colors.pill,
            )}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

const SITEMAP_GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "의료기록",
    items: [
      { href: "/visits", label: "방문이력" },
      { href: "/appointments", label: "예약" },
      { href: "/checkups", label: "건강검진" },
    ],
  },
  {
    label: "건강추적",
    items: [
      { href: "/health", label: "건강일지" },
      { href: "/health/chart", label: "그래프" },
      { href: "/period", label: "생리주기" },
      { href: "/meals", label: "식단" },
    ],
  },
  {
    label: "설정",
    items: [{ href: "/profile", label: "프로필" }],
  },
];

function Sitemap() {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">전체 메뉴</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {SITEMAP_GROUPS.map((g) => (
          <div key={g.label}>
            <div className="mb-1 text-xs text-muted-foreground">{g.label}</div>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className="block rounded px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
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
