import { PageShell } from "@/components/PageShell";
import { type CalendarEvent } from "@/components/Calendar";
import {
  DashboardView,
  type RecentRecord,
  type UpcomingAppointment,
} from "@/components/dashboard/DashboardView";
import type { LanhaSnapshot } from "@/components/dashboard/LanhaTodayCard";
import {
  getProfile,
  listAppointments,
  listCheckups,
  listHealthLogs,
  listVisits,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import { currentSubject } from "@/lib/current-subject";
import { formatKoreanDate, todayKST } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  // URL 파라미터가 있으면 우선, 없으면 상단 PersonSwitcher 쿠키 (디폴트 박란하).
  const subject =
    sp.subject != null ? asPerson(sp.subject) : await currentSubject();

  const [allAppts, allHealth, allVisits, allCheckups, profile] =
    await Promise.all([
      listAppointments(),
      listHealthLogs(),
      listVisits(),
      listCheckups(),
      getProfile("박란하"),
    ]);

  const today = todayKST();
  const todayKey = today.key;
  const dateLabel = formatKoreanDate(today.key);

  // 박란하 스냅샷 — 필터와 무관하게 계산. 클라이언트가 표시 여부 결정.
  const lanhaHealth = allHealth.filter(
    (h) => asPerson(h.subject) === "박란하",
  );
  const latestMood = lanhaHealth.find((h) => h.moodScale != null);
  const latestSleep = lanhaHealth.find((h) => h.sleepHours != null);
  const latestWeightLog = lanhaHealth.find((h) => h.weight != null);
  const startWeight = profile?.startWeightKg;
  const weightDelta =
    latestWeightLog?.weight != null && startWeight != null
      ? latestWeightLog.weight - startWeight
      : undefined;

  const snapshot: LanhaSnapshot | null =
    latestWeightLog || latestMood || latestSleep
      ? {
          todayKey,
          latestMoodScale: latestMood?.moodScale,
          latestMoodDate: latestMood?.date,
          latestSleepHours: latestSleep?.sleepHours,
          latestSleepDate: latestSleep?.date,
          latestWeight: latestWeightLog?.weight,
          latestWeightDate: latestWeightLog?.date,
          weightDeltaSinceStart: weightDelta,
          startWeight,
        }
      : null;

  // 다가오는 예약 — 미래 시점만, 전체 가족
  const now = new Date();
  const upcomingAppts: UpcomingAppointment[] = allAppts
    .filter((a) => new Date(a.datetime) >= now)
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
    .slice(0, 20)
    .map((a) => ({
      id: a.id,
      datetime: a.datetime,
      hospitalName: a.hospitalName,
      reason: a.reason,
      subject: a.subject,
    }));

  // "최근 등록" 섹션 — 모든 종류 섞어서 최신순 (createdAt 기준).
  // page.tsx 에서 20건 추려서 넘기면 클라이언트가 subject 필터 후 3건만 렌더.
  const recentRecords: RecentRecord[] = [
    ...allVisits.map(
      (v): RecentRecord => ({
        id: v.id,
        date: v.createdAt?.slice(0, 10) ?? v.date,
        kind: "visit",
        title: `${v.hospitalName} · ${v.diagnosis}`,
        subject: v.subject,
        href: `/visits/${v.date.slice(0, 4)}/${v.id}`,
      }),
    ),
    ...allAppts.map(
      (a): RecentRecord => ({
        id: a.id,
        date: a.createdAt?.slice(0, 10) ?? a.datetime.slice(0, 10),
        kind: "appointment",
        title: `${a.hospitalName}${a.reason ? ` · ${a.reason}` : ""}`,
        subject: a.subject,
        href: `/appointments/${a.datetime.slice(0, 4)}/${a.id}`,
      }),
    ),
    ...allCheckups.map(
      (c): RecentRecord => ({
        id: c.id,
        date: c.createdAt?.slice(0, 10) ?? c.date,
        kind: "checkup",
        title: c.title,
        subject: c.subject,
        href: `/checkups/${c.date.slice(0, 4)}/${c.id}`,
      }),
    ),
    ...allHealth.map(
      (h): RecentRecord => ({
        id: h.id,
        date: h.createdAt?.slice(0, 10) ?? h.date,
        kind: "health",
        title: `${h.date} 리포트`,
        subject: h.subject,
        href: `/health/${h.date.slice(0, 4)}/${h.id}`,
      }),
    ),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  // 캘린더 이벤트 (visits + appointments)
  const calendarEvents: CalendarEvent[] = [
    ...allVisits.map((v) => ({
      id: v.id,
      date: v.date,
      title: `${v.hospitalName} · ${v.diagnosis}`,
      type: "visit" as const,
      subject: v.subject,
      href: `/visits/${v.date.slice(0, 4)}/${v.id}`,
    })),
    ...allAppts.map((a) => ({
      id: a.id,
      date: a.datetime.slice(0, 10),
      title: `${a.hospitalName}${a.reason ? ` · ${a.reason}` : ""}`,
      type: "appointment" as const,
      subject: a.subject,
      href: `/appointments/${a.datetime.slice(0, 4)}/${a.id}`,
    })),
  ];

  return (
    <PageShell title="홈">
      <DashboardView
        subject={subject}
        snapshot={snapshot}
        upcomingAppts={upcomingAppts}
        calendarEvents={calendarEvents}
        recentRecords={recentRecords}
        todayKey={todayKey}
        dateLabel={dateLabel}
      />
    </PageShell>
  );
}
