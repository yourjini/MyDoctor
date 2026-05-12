import { PageShell } from "@/components/PageShell";
import { DashboardView, type UpcomingAppointment } from "@/components/dashboard/DashboardView";
import type { LanhaSnapshot } from "@/components/dashboard/LanhaTodayCard";
import {
  getProfile,
  listAppointments,
  listHealthLogs,
  listMeals,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import { calorieTargetFor, sumCalories } from "@/lib/calorie";
import { todayKST } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const initialSubject = asPerson(sp.subject);

  // 대시보드는 박란하 추적 + 다가오는 예약만 — visits/checkups는 각 페이지에서.
  const [allAppts, allHealth, allMeals, profile] = await Promise.all([
    listAppointments(),
    listHealthLogs(),
    listMeals(),
    getProfile("박란하"),
  ]);

  const todayKey = todayKST().key;

  // 박란하 스냅샷 — 필터와 무관하게 계산. 클라이언트가 표시 여부 결정.
  const lanhaHealth = allHealth.filter((h) => asPerson(h.subject) === "박란하");
  const latestMood = lanhaHealth.find((h) => h.moodScale != null);
  const latestSleep = lanhaHealth.find((h) => h.sleepHours != null);
  const latestWeightLog = lanhaHealth.find((h) => h.weight != null);
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
        targetKcal: target?.target,
        todayKcal: kcalSum.kcal,
        todayCounted: kcalSum.counted,
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

  return (
    <PageShell title="오늘">
      <DashboardView
        initialSubject={initialSubject}
        snapshot={snapshot}
        upcomingAppts={upcomingAppts}
      />
    </PageShell>
  );
}
