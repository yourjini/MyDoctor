import { PageShell } from "@/components/PageShell";
import { type CalendarEvent } from "@/components/Calendar";
import { DashboardView, type UpcomingAppointment } from "@/components/dashboard/DashboardView";
import type { LanhaSnapshot } from "@/components/dashboard/LanhaTodayCard";
import {
  getProfile,
  listAppointments,
  listHealthLogs,
  listVisits,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import { currentSubject } from "@/lib/current-subject";
import { todayKST } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  // 상단 전역 인물 선택기(쿠키)를 초기값으로. URL 파라미터가 있으면 우선.
  const initialSubject =
    sp.subject != null ? asPerson(sp.subject) : await currentSubject("박란하");

  // 캘린더는 visits + appointments. health는 박란하 스냅샷용.
  const [allAppts, allHealth, allVisits, profile] = await Promise.all([
    listAppointments(),
    listHealthLogs(),
    listVisits(),
    getProfile("박란하"),
  ]);

  const todayKey = todayKST().key;

  // 박란하 스냅샷 — 필터와 무관하게 계산. 클라이언트가 표시 여부 결정.
  const lanhaHealth = allHealth.filter((h) => asPerson(h.subject) === "박란하");
  const latestMood = lanhaHealth.find((h) => h.moodScale != null);
  const latestSleep = lanhaHealth.find((h) => h.sleepHours != null);
  const latestWeightLog = lanhaHealth.find((h) => h.weight != null);
  const startWeight = profile?.startWeightKg;
  const weightDelta =
    latestWeightLog?.weight != null && startWeight != null
      ? latestWeightLog.weight - startWeight
      : undefined;

  const snapshot: LanhaSnapshot | null = latestWeightLog || latestMood || latestSleep
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
    <PageShell title="오늘">
      <DashboardView
        initialSubject={initialSubject}
        snapshot={snapshot}
        upcomingAppts={upcomingAppts}
        calendarEvents={calendarEvents}
        todayKey={todayKey}
      />
    </PageShell>
  );
}
