import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { type CalendarEvent } from "@/components/Calendar";
import { CollapsibleCalendar } from "@/components/dashboard/CollapsibleCalendar";
import { LanhaTodayCard, type LanhaSnapshot } from "@/components/dashboard/LanhaTodayCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { KindChip } from "@/components/KindChip";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import {
  getProfile,
  listAppointments,
  listCheckups,
  listHealthLogs,
  listMeals,
  listVisits,
} from "@/lib/store";
import { asPerson, matchesFilter } from "@/lib/people";
import { calorieTargetFor, sumCalories } from "@/lib/calorie";
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

type ActivityItem = {
  id: string;
  date: string;
  kind: "visit" | "appointment" | "checkup" | "health";
  title: string;
  sub?: string;
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

  const [allVisits, allAppts, allCheckups, allHealth, allMeals] =
    await Promise.all([
      listVisits(),
      listAppointments(),
      listCheckups(),
      listHealthLogs(),
      listMeals(),
    ]);

  const visits = allVisits.filter((v) => matchesFilter(v.subject, filter));
  const appts = allAppts.filter((a) => matchesFilter(a.subject, filter));
  const checkups = allCheckups.filter((c) => matchesFilter(c.subject, filter));
  const healths = allHealth.filter((h) => matchesFilter(h.subject, filter));

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
  // "최근". Only strictly future-dated visits (pre-created entries like a
  // recurring weekly therapy session) belong in the upcoming list.
  const todayKey = todayKST().key;
  const futureVisits = visits.filter((v) => v.date > todayKey);

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
    .slice(0, 4);

  // ─── Recent activity: merge visits/checkups/health, latest first ───────
  const activity: ActivityItem[] = [
    ...visits
      .filter((v) => v.date <= todayKey)
      .map((v) => ({
        id: `v-${v.id}`,
        date: v.date,
        kind: "visit" as const,
        title: v.hospitalName,
        sub: v.diagnosis,
        subject: v.subject,
        href: `/visits/${v.date.slice(0, 4)}/${v.id}`,
      })),
    ...checkups.map((c) => ({
      id: `c-${c.id}`,
      date: c.date,
      kind: "checkup" as const,
      title: c.title,
      sub: c.hospitalName,
      subject: c.subject,
      href: `/checkups/${c.date.slice(0, 4)}/${c.id}`,
    })),
    ...healths.map((h) => ({
      id: `h-${h.id}`,
      date: h.date,
      kind: "health" as const,
      title: healthSummary(h),
      sub: h.note,
      subject: h.subject,
      href: `/health/${h.date.slice(0, 4)}/${h.id}`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // ─── Snapshot for 박란하 ──────────────────────────────────────────────
  const showLanha = filter === "전체" || filter === "박란하";
  let snapshot: LanhaSnapshot | null = null;
  if (showLanha) {
    const lanhaHealth = allHealth.filter(
      (h) => asPerson(h.subject) === "박란하",
    );
    const latestMood = lanhaHealth.find((h) => h.moodScale != null);
    const latestSleep = lanhaHealth.find((h) => h.sleepHours != null);
    const latestWeightLog = lanhaHealth.find((h) => h.weight != null);

    const profile = await getProfile("박란하");
    const target = calorieTargetFor(profile, latestWeightLog?.weight ?? null);

    const todayMeals = allMeals.filter(
      (m) => m.date === todayKey && asPerson(m.subject) === "박란하",
    );
    const kcalSum = sumCalories(todayMeals);

    const startWeight = profile?.startWeightKg;
    const weightDelta =
      latestWeightLog?.weight != null && startWeight != null
        ? latestWeightLog.weight - startWeight
        : undefined;

    snapshot = {
      todayKey,
      latestMoodScale: latestMood?.moodScale,
      latestMoodDate: latestMood?.date,
      latestSleepHours: latestSleep?.sleepHours,
      latestSleepDate: latestSleep?.date,
      latestWeight: latestWeightLog?.weight,
      latestWeightDate: latestWeightLog?.date,
      weightDeltaSinceStart: weightDelta,
      startWeight,
      targetKcal: target?.target,
      todayKcal: kcalSum.kcal,
      todayCounted: kcalSum.counted,
    };
  }

  return (
    <PageShell title="오늘">
      <div className="mb-3">
        <SubjectFilter />
      </div>

      <div className="space-y-4">
        {snapshot && <LanhaTodayCard snap={snapshot} />}

        <QuickActions />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 다가오는 일정 */}
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
            {upcoming.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                예정된 일정이 없습니다.
              </p>
            ) : (
              <ul className="space-y-1">
                {upcoming.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      href={item.href}
                      className="flex min-h-[44px] items-center gap-3 rounded p-2 text-sm hover:bg-accent"
                    >
                      <SubjectBadge subject={item.subject} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <KindChip kind={item.kind} size="sm" />
                          <span className="truncate font-medium">
                            {item.hospitalName}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
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

          {/* 최근 활동 (mixed) */}
          <section className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">최근 활동</h2>
            </div>
            {activity.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                기록된 활동이 없습니다.
              </p>
            ) : (
              <ul className="space-y-1">
                {activity.map((it) => (
                  <li key={it.id}>
                    <Link
                      href={it.href}
                      className="flex min-h-[44px] items-center gap-3 rounded p-2 text-sm hover:bg-accent"
                    >
                      <SubjectBadge subject={it.subject} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <KindChip kind={it.kind} size="sm" />
                          <span className="truncate font-medium">
                            {it.title}
                          </span>
                        </div>
                        {it.sub && (
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {it.sub}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {formatKDate(it.date)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <CollapsibleCalendar
          events={events}
          defaultOpen={false}
          badge={`이번 달 ${events.filter((e) => e.date.startsWith(todayKey.slice(0, 7))).length}건`}
        />
      </div>
    </PageShell>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────

function healthSummary(h: {
  bodyTags: string[];
  moodTags: string[];
  moodScale?: number;
  sleepHours?: number;
  weight?: number;
}): string {
  const parts: string[] = [];
  if (h.moodScale != null)
    parts.push(`기분 ${h.moodScale > 0 ? "+" : ""}${h.moodScale}`);
  if (h.sleepHours != null) parts.push(`수면 ${h.sleepHours}h`);
  if (h.weight != null) parts.push(`${h.weight}kg`);
  if (parts.length > 0) return parts.join(" · ");
  const tag = [...h.bodyTags, ...h.moodTags][0];
  return tag ?? "건강일지";
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
