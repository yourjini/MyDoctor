import type { MenstrualCycle } from "./types";

export type PeriodStats = {
  count: number; // 기록 수
  avgCycleDays?: number; // 시작일 간 평균 일수
  avgPeriodDays?: number; // 시작~종료 평균 일수
  lastStart?: string; // 가장 최근 시작일
  nextExpected?: string; // 예측 다음 시작일 (YYYY-MM-DD)
};

export function computePeriodStats(
  cycles: MenstrualCycle[],
  subject: string,
): PeriodStats {
  const mine = cycles
    .filter((c) => c.subject === subject)
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (mine.length === 0) return { count: 0 };

  const lastStart = mine[mine.length - 1].startDate;

  // 평균 사이클 길이 (연속 시작일 간격)
  let avgCycleDays: number | undefined;
  if (mine.length >= 2) {
    let total = 0;
    for (let i = 1; i < mine.length; i++) {
      total += daysBetween(mine[i - 1].startDate, mine[i].startDate);
    }
    avgCycleDays = Math.round(total / (mine.length - 1));
  }

  // 평균 기간 (start~end), endDate가 있는 사이클만
  const completed = mine.filter((c) => c.endDate);
  let avgPeriodDays: number | undefined;
  if (completed.length > 0) {
    const total = completed.reduce(
      (s, c) => s + daysBetween(c.startDate, c.endDate!) + 1,
      0,
    );
    avgPeriodDays = Math.round(total / completed.length);
  }

  // 다음 예정일
  let nextExpected: string | undefined;
  if (avgCycleDays) {
    nextExpected = addDays(lastStart, avgCycleDays);
  }

  return {
    count: mine.length,
    avgCycleDays,
    avgPeriodDays,
    lastStart,
    nextExpected,
  };
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
