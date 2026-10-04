import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { listMenstrualCycles } from "@/lib/store";
import { computePeriodStats, daysBetween } from "@/lib/period-stats";
import { PERSON_COLORS } from "@/lib/people";
import { MENSTRUATION_LABEL } from "@/lib/health-tags";
import { cn, formatDate, todayKST } from "@/lib/utils";
import { PeriodSubjectFilter } from "./PeriodSubjectFilter";
import { startTodayAction, endTodayAction } from "./actions";
import type { MenstrualCycle } from "@/lib/types";

export const dynamic = "force-dynamic";

const PERIOD_SUBJECTS = ["박란하", "최진희"] as const;
const FILTER_OPTIONS = ["전체", ...PERIOD_SUBJECTS] as const;
type PeriodSubject = (typeof PERIOD_SUBJECTS)[number];
type FilterValue = (typeof FILTER_OPTIONS)[number];

function isFilter(value: unknown): value is FilterValue {
  return (
    typeof value === "string" &&
    (FILTER_OPTIONS as readonly string[]).includes(value)
  );
}

export default async function PeriodPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const filter: FilterValue = isFilter(sp.subject) ? sp.subject : "전체";

  const all = await listMenstrualCycles();
  const visible =
    filter === "전체"
      ? all.filter((c) =>
          (PERIOD_SUBJECTS as readonly string[]).includes(c.subject),
        )
      : all.filter((c) => c.subject === filter);

  return (
    <PageShell
      title="생리주기"
      action={
        <Link
          href={`/period/new${filter !== "전체" ? `?subject=${encodeURIComponent(filter)}` : ""}`}
          className="inline-flex min-h-11 items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
        >
          + 수동 입력
        </Link>
      }
    >
      <div className="mb-4">
        <PeriodSubjectFilter current={filter} subjects={FILTER_OPTIONS} />
      </div>

      {filter === "전체" ? (
        <CombinedView all={all} />
      ) : (
        <SingleSubjectView subject={filter} all={all} cycles={visible} />
      )}
    </PageShell>
  );
}

// ============================================================
// 전체 탭: 두 사람 카드 나란히 + 합쳐진 기록 리스트
// ============================================================

function CombinedView({ all }: { all: MenstrualCycle[] }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2">
        {PERIOD_SUBJECTS.map((subj) => (
          <SubjectSummaryCard key={subj} subject={subj} all={all} />
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          전체 기록
        </h2>
        <CombinedList
          cycles={all
            .filter((c) =>
              (PERIOD_SUBJECTS as readonly string[]).includes(c.subject),
            )
            .slice()
            .sort((a, b) => b.startDate.localeCompare(a.startDate))}
          showSubject
        />
      </section>
    </div>
  );
}

function SubjectSummaryCard({
  subject,
  all,
}: {
  subject: PeriodSubject;
  all: MenstrualCycle[];
}) {
  const cycles = all.filter((c) => c.subject === subject);
  const ongoing = cycles.find((c) => !c.endDate);
  const stats = computePeriodStats(all, subject);
  const today = todayKST().key;
  const colors = PERSON_COLORS[subject];

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={`/period?subject=${encodeURIComponent(subject)}`}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            colors.pillActive,
          )}
        >
          {subject}
        </Link>
        <Link
          href={`/period?subject=${encodeURIComponent(subject)}`}
          className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground hover:underline"
        >
          상세 →
        </Link>
      </div>

      {ongoing ? (
        <div className="space-y-2">
          <div>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
              진행 중
            </span>
            <div className="mt-1 text-sm">
              {ongoing.startDate} 시작 ·{" "}
              <span className="font-medium">
                {daysBetween(ongoing.startDate, today) + 1}일째
              </span>
            </div>
          </div>
          <form action={endTodayAction}>
            <input type="hidden" name="id" value={ongoing.id} />
            <input
              type="hidden"
              name="year"
              value={ongoing.startDate.slice(0, 4)}
            />
            <button
              type="submit"
              className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
            >
              오늘 종료
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-2">
          {stats.nextExpected ? (
            <div className="text-sm">
              {expectedRelative(today, stats.nextExpected)}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              아직 기록 없음
            </div>
          )}
          <form action={startTodayAction}>
            <input type="hidden" name="subject" value={subject} />
            <button
              type="submit"
              className="w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
            >
              오늘 시작
            </button>
          </form>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
        <Stat
          label="기록"
          value={stats.count > 0 ? `${stats.count}회` : "—"}
        />
        <Stat
          label="평균주기"
          value={stats.avgCycleDays ? `${stats.avgCycleDays}일` : "—"}
        />
        <Stat
          label="평균기간"
          value={stats.avgPeriodDays ? `${stats.avgPeriodDays}일` : "—"}
        />
      </div>
    </div>
  );
}

// ============================================================
// 개인 탭: 기존 단일 대상자 뷰
// ============================================================

function SingleSubjectView({
  subject,
  all,
  cycles,
}: {
  subject: PeriodSubject;
  all: MenstrualCycle[];
  cycles: MenstrualCycle[];
}) {
  const stats = computePeriodStats(all, subject);
  const ongoing = cycles.find((c) => !c.endDate);
  const today = todayKST().key;

  return (
    <>
      <section className="mb-5 rounded-lg border bg-card p-4">
        {ongoing ? (
          <OngoingCard cycle={ongoing} today={today} />
        ) : (
          <StartCard subject={subject} stats={stats} today={today} />
        )}
      </section>

      {stats.count > 0 && (
        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="기록 수" value={`${stats.count}`} unit="회" />
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

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          전체 기록
        </h2>
        <CombinedList cycles={cycles} />
      </section>
    </>
  );
}

function CombinedList({
  cycles,
  showSubject = false,
}: {
  cycles: MenstrualCycle[];
  showSubject?: boolean;
}) {
  if (cycles.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        아직 기록이 없습니다.
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {cycles.map((c) => {
        const year = c.startDate.slice(0, 4);
        const days = c.endDate ? daysBetween(c.startDate, c.endDate) + 1 : null;
        const colors =
          (PERSON_COLORS[
            c.subject as keyof typeof PERSON_COLORS
          ]) ?? PERSON_COLORS["전체"];
        return (
          <Link
            key={c.id}
            href={`/period/${year}/${c.id}`}
            className="block rounded-lg border bg-card p-3 hover:bg-accent/40"
          >
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              {showSubject && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    colors.pillActive,
                  )}
                >
                  {c.subject}
                </span>
              )}
              {!c.endDate && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700">
                  진행 중
                </span>
              )}
              <span className="font-medium">
                {c.startDate.slice(5)}
                {c.endDate && (
                  <span className="text-muted-foreground">
                    {" ~ "}{c.endDate.slice(5)}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span>{c.startDate.slice(0, 4)}</span>
              {days != null && <span>· {days}일</span>}
              {c.flow && <span>· {MENSTRUATION_LABEL[c.flow]}</span>}
            </div>
            {c.notes && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {c.notes}
              </p>
            )}
          </Link>
        );
      })}
    </div>
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
          className="w-full rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100 sm:w-auto"
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
        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
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
            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function expectedRelative(today: string, expected: string): string {
  const diff = daysBetween(today, expected);
  if (diff > 0) return `다음 예정: ${expected} (${diff}일 후)`;
  if (diff === 0) return `다음 예정: 오늘`;
  return `예정일 ${-diff}일 지남 (${expected})`;
}
