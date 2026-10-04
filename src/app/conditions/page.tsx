import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { matchesFilter } from "@/lib/people";
import { currentSubject } from "@/lib/current-subject";
import { listConditionRecords } from "@/lib/store";
import {
  STATUS_LIST,
  STATUS_META,
} from "@/lib/health-conditions";
import { cn } from "@/lib/utils";
import type {
  ConditionExam,
  ConditionStatus,
  HealthCondition,
} from "@/lib/types";
import { seedConditionsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConditionsPage() {
  // 상단 전역 인물 선택기(쿠키)를 따라간다. 기본은 박란하.
  const filter = await currentSubject("박란하");

  const { conditions, exams } = await listConditionRecords();

  // conditionId → 최신 검사
  const latestExam = new Map<string, ConditionExam>();
  for (const e of exams) {
    const cur = latestExam.get(e.conditionId);
    // 같은 날짜면 더 최근에 작성된 것을 최신으로
    const newer =
      !cur ||
      e.date > cur.date ||
      (e.date === cur.date && e.createdAt > cur.createdAt);
    if (newer) latestExam.set(e.conditionId, e);
  }

  const visible = conditions.filter((c) => matchesFilter(c.subject, filter));

  // 상태별 그룹
  const byStatus = new Map<ConditionStatus, HealthCondition[]>();
  for (const c of visible) {
    const arr = byStatus.get(c.status) ?? [];
    arr.push(c);
    byStatus.set(c.status, arr);
  }

  return (
    <PageShell
      title="건강자료"
      action={
        <Link
          href="/conditions/new"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + 질환 추가
        </Link>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <SubjectBadge subject={filter} size="sm" showName />
        <p className="text-sm text-muted-foreground">
          님의 부위별 질환·검사 이력 (상단에서 사람 변경)
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState showSeed={filter === "최진희"} />
      ) : (
        <div className="space-y-6">
          {STATUS_LIST.map((status) => {
            const list = byStatus.get(status);
            if (!list || list.length === 0) return null;
            const meta = STATUS_META[status];
            // nextDate 있는 것 먼저, 그 다음 마지막 검사일 오래된 순
            const sorted = list.slice().sort((a, b) => {
              if (!!a.nextDate !== !!b.nextDate) return a.nextDate ? -1 : 1;
              // 마지막 검사가 오래된 것 먼저, 검사 없는 항목은 맨 뒤
              const ea = latestExam.get(a.id)?.date ?? "9999-99-99";
              const eb = latestExam.get(b.id)?.date ?? "9999-99-99";
              return ea.localeCompare(eb);
            });
            return (
              <section key={status}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px]", meta.chip)}>
                    {meta.label}
                  </span>
                  <span className="text-muted-foreground">{list.length}건</span>
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sorted.map((c) => (
                    <ConditionCard
                      key={c.id}
                      condition={c}
                      latest={latestExam.get(c.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function ConditionCard({
  condition,
  latest,
}: {
  condition: HealthCondition;
  latest?: ConditionExam;
}) {
  const meta = STATUS_META[condition.status];
  return (
    <Link
      href={`/conditions/${condition.id}`}
      className={cn(
        "block rounded-lg border bg-card p-3 hover:bg-accent/40",
        meta.card,
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="font-medium">{condition.bodyPart}</span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px]", meta.chip)}>
          {meta.label}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{condition.diagnosis}</div>
      {condition.nextAction && (
        <div className="mt-1.5 text-[11px] font-medium text-amber-700">
          📅 {condition.nextAction}
          {condition.nextDate && ` · ${condition.nextDate}`}
        </div>
      )}
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">
        {latest ? `마지막 검사 ${latest.date}` : "검사 기록 없음"}
      </div>
    </Link>
  );
}

function EmptyState({ showSeed }: { showSeed: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <p className="mb-1 text-sm text-muted-foreground">
        등록된 질환이 없습니다.
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        부위별로 추적하면 검사 시기를 놓치지 않아요.
      </p>
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/conditions/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + 첫 질환 추가하기
        </Link>
        {showSeed && (
          <>
            <form action={seedConditionsAction}>
              <button
                type="submit"
                className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                📋 최진희 검진 데이터 한 번에 등록
              </button>
            </form>
            <p className="text-[11px] text-muted-foreground">
              유방·갑상선·위·자궁 등 10개 항목 + 검사 이력
            </p>
          </>
        )}
      </div>
    </div>
  );
}
