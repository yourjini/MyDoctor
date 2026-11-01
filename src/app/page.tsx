import { PageShell } from "@/components/PageShell";
import { type CalendarEvent } from "@/components/Calendar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import type { LanhaSnapshot } from "@/components/dashboard/LanhaTodayCard";
import {
  getProfile,
  listAppointments,
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

  const [allAppts, allHealth, allVisits, profile] = await Promise.all([
    listAppointments(),
    listHealthLogs(),
    listVisits(),
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

  // 캘린더용 — 방문으로 연결됐거나 완료·비방문된 예약은 제외.
  const visitLinkedApptIds = new Set(
    allVisits.map((v) => v.appointmentId).filter((x): x is string => !!x),
  );
  const activeAppts = allAppts.filter(
    (a) =>
      !visitLinkedApptIds.has(a.id) &&
      a.status !== "completed" &&
      a.status !== "missed",
  );

  const calendarEvents: CalendarEvent[] = [
    ...allVisits.map((v) => ({
      id: v.id,
      date: v.date,
      title: `${v.hospitalName} · ${v.diagnosis}`,
      type: "visit" as const,
      subject: v.subject,
      href: `/visits/${v.date.slice(0, 4)}/${v.id}`,
    })),
    ...activeAppts.map((a) => ({
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
        calendarEvents={calendarEvents}
        todayKey={todayKey}
        dateLabel={dateLabel}
      />
    </PageShell>
  );
}
