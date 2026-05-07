import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { listMenstrualCycles } from "@/lib/store";
import { computePeriodStats, daysBetween } from "@/lib/period-stats";
import { PERSON_COLORS } from "@/lib/people";
import { MENSTRUATION_LABEL } from "@/lib/health-tags";
import { cn, formatDate, todayKST } from "@/lib/utils";
import { PeriodSubjectFilter } from "./PeriodSubjectFilter";
import { startTodayAction, endTodayAction } from "./actions";

export const dynamic = "force-dynamic";

const PERIOD_SUBJECTS = ["박란하", "최진희"] as const;
type PeriodSubject = (typeof PERIOD_SUBJECTS)[number];

function isPeriodSubject(value: unknown): value is PeriodSubject {
  return (
    typeof value === "string" &&
    (PERIOD_SUBJECTS as readonly string[]).includes(value)
  );
}

export default async function PeriodPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const subject: PeriodSubject = isPeriodSubject(sp.subject)
    ? sp.subject
    : "최진희";

  const all = await listMenstrualCycles();
  const cycles = all.filter((c) => c.subject === subject);
  const stats = computePeriodStats(all, subject);
  const ongoing = cycles.find((c) => !c.endDate);
  const today = todayKST().key;
  const colors = PERSON_COLORS[subject];

  return (
    <PageShell
      title="생리주기"
      action={
        <Link
          href="/period/new"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            colors.pillActive,
          )}
        >
          + 수동 입력
        </Link>
      }
    >
      <div className="mb-4">
        <PeriodSubjectFilter current={subject} subjects={PERIOD_SUBJECTS} />
      </div>

      {/* 활성 사이클 또는 시작 버튼 */}
      <section className="mb-5 rounded-lg border bg-card p-4">
        {ongoing ? (
          <OngoingCard cycle={ongoing} today={today} />
        ) : (
          <StartCard subject={subject} stats={stats} today={today} />
        )}
      </section>

      {/* 통계 */}
      {stats.count > 0 && (
        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            label="기록 수"
            value={`${stats.count}`}
            unit="회"
          />
          <StatBox
            label="평균 주기"
            value={stats.avgCycleDays ? `${stats.avgCycleDays}` : "—"}
            unit={stats.avgCycleDays ? "일" : ""}
          />
          <StatBox
            label="평균 기간"
            value={stats.avgPeriodDays ? `${stats.avgPeriodDays}` : "—"}
            unit={stats.avgPeriodDays ? "일" : ""}
          />
          <StatBox
            label="다음 예정"
            value={
              stats.nextExpected ? formatDate(stats.nextExpected, false) : "—"
            }
          />
        </section>
      )}

      {/* 사이클 리스트 */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          전체 기록
        </h2>
        {cycles.length === 0 ? (
          <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            아직 기록이 없습니다.
          </p>
        ) : (
          <ul className="rounded-lg border bg-card divide-y">
            {cycles.map((c) => {
              const year = c.startDate.slice(0, 4);
              const days = c.endDate
                ? daysBetween(c.startDate, c.endDate) + 1
                : null;
              return (
                <li key={c.id}>
                  <Link
                    href={`/period/${year}/${c.id}`}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        {c.startDate}
                        {c.endDate && (
                          <span className="text-muted-foreground">
                            {" "}
                            ~ {c.endDate}
                          </span>
                        )}
                        {!c.endDate && (
                          <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-900">
                            진행 중
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        {days != null && <span>{days}일</span>}
                        {c.flow && (
                          <span>·  {MENSTRUATION_LABEL[c.flow]}</span>
                        )}
                        {c.notes && (
                          <span className="truncate">· {c.notes}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-muted-foreground">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

function StartCard({
  subject,
  stats,
  today,
}: {
  subject: PeriodSubject;
  stats: ReturnType<typeof computePeriodStats>;
  today: string;
}) {
  const expectedNote = stats.nextExpected
    ? expectedRelative(today, stats.nextExpected)
    : null;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm text-muted-foreground">
          {subject} · 진행 중인 사이클 없음
        </div>
        {expectedNote && (
          <div className="mt-1 text-sm font-medium">{expectedNote}</div>
        )}
      </div>
      <form action={startTodayAction}>
        <input type="hidden" name="subject" value={subject} />
        <button
          type="submit"
          className="w-full rounded-md bg-rose-500 px-4 py-3 text-sm font-medium text-white hover:bg-rose-600 sm:w-auto"
        >
          오늘 ({today.slice(5)}) 생리 시작
        </button>
      </form>
    </div>
  );
}

function OngoingCard({
  cycle,
  today,
}: {
  cycle: { id: string; startDate: string };
  today: string;
}) {
  const elapsed = daysBetween(cycle.startDate, today) + 1;
  const year = cycle.startDate.slice(0, 4);
  return (
    <div className="space-y-3">
      <div>
        <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-medium text-white">
          진행 중
        </span>
        <div className="mt-1.5 text-sm">
          <span className="font-medium">{cycle.startDate}</span> 시작 ·{" "}
          <span className="font-medium">{elapsed}일째</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <form action={endTodayAction}>
          <input type="hidden" name="id" value={cycle.id} />
          <input type="hidden" name="year" value={year} />
          <button
            type="submit"
            className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            오늘 ({today.slice(5)}) 종료
          </button>
        </form>
        <Link
          href={`/period/${year}/${cycle.id}`}
          className="rounded-md border bg-background px-4 py-2 text-sm hover:bg-accent"
        >
          수정
        </Link>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">
        {value}
        {unit && <span className="ml-1 text-sm font-normal">{unit}</span>}
      </div>
    </div>
  );
}

function expectedRelative(today: string, expected: string): string {
  const diff = daysBetween(today, expected);
  if (diff > 0) return `다음 예정: ${expected} (${diff}일 후)`;
  if (diff === 0) return `다음 예정: 오늘`;
  return `예정일 ${-diff}일 지남 (${expected})`;
}
