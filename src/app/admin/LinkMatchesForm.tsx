"use client";

import { useMemo, useState, useTransition } from "react";
import { linkVisitAppointmentsAction } from "./actions";

export type MatchRow = {
  pair: string; // `${visitYear}:${visitId}:${apptId}`
  visitDate: string;
  apptDatetime: string;
  dayDiff: number;
  nameExact: boolean;
  subject?: string;
  visitHospital: string;
  apptHospital: string;
  diagnosis: string;
  reason?: string;
};

export function LinkMatchesForm({ rows }: { rows: MatchRow[] }) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(rows.map((r) => r.pair)),
  );
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    linked: number;
    failed: Array<{ pair: string; message: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allChecked = checked.size === rows.length;
  const noneChecked = checked.size === 0;

  const unmatchedPairs = useMemo(() => {
    if (!result) return rows;
    const linkedPairs = new Set(result.failed.map((f) => f.pair));
    // 성공한 쌍은 사라져야 하므로, 전체 rows 중 failed 아닌 쌍은 성공한 것으로 간주.
    return rows.filter((r) => linkedPairs.has(r.pair));
  }, [rows, result]);

  function toggle(pair: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(pair)) next.delete(pair);
      else next.add(pair);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) setChecked(new Set());
    else setChecked(new Set(rows.map((r) => r.pair)));
  }

  function apply() {
    setError(null);
    setResult(null);
    const pairs = Array.from(checked);
    if (pairs.length === 0) return;
    startTransition(async () => {
      try {
        const r = await linkVisitAppointmentsAction(pairs);
        setResult(r);
        // 성공한 쌍은 체크에서 제거.
        setChecked((prev) => {
          const next = new Set(prev);
          const failedPairs = new Set(r.failed.map((f) => f.pair));
          for (const p of Array.from(next)) {
            if (!failedPairs.has(p)) next.delete(p);
          }
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "연결 실패");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        매칭 가능한 쌍이 없습니다. (이미 모두 연결됐거나, 기준에 맞는
        방문·예약이 없음)
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleAll}
          className="min-h-11 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent"
        >
          {allChecked ? "전체 해제" : "전체 선택"}
        </button>
        <span className="text-xs text-muted-foreground">
          {checked.size} / {rows.length} 선택됨
        </span>
      </div>

      <ul className="divide-y rounded-md border bg-background">
        {rows.map((r) => {
          const isChecked = checked.has(r.pair);
          const isDone =
            result != null && !result.failed.some((f) => f.pair === r.pair);
          return (
            <li
              key={r.pair}
              className={`flex gap-3 p-3 text-sm ${isDone ? "opacity-50" : ""}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={pending || isDone}
                onChange={() => toggle(r.pair)}
                className="mt-1 h-4 w-4 shrink-0"
                aria-label={`${r.visitDate} ${r.visitHospital} 연결`}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                    방문 {r.visitDate}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    예약 {r.apptDatetime.slice(0, 10)}{" "}
                    {r.apptDatetime.slice(11, 16)}
                  </span>
                  {r.subject && (
                    <span className="text-xs text-muted-foreground">
                      · {r.subject}
                    </span>
                  )}
                  {r.dayDiff === 0 ? (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] text-emerald-700">
                      당일
                    </span>
                  ) : (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-700">
                      {Math.round(r.dayDiff)}일 차이
                    </span>
                  )}
                  {!r.nameExact && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-700">
                      병원명 부분일치
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {r.visitHospital}
                  </span>
                  {r.visitHospital !== r.apptHospital && (
                    <> ↔ {r.apptHospital}</>
                  )}
                  {" · "}
                  {r.diagnosis}
                  {r.reason && ` · 예약사유: ${r.reason}`}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={pending || noneChecked}
          className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "연결 중…" : `선택한 ${checked.size}건 연결`}
        </button>
        {result && result.linked > 0 && (
          <span className="text-sm text-emerald-700">
            {result.linked}건 연결 완료
          </span>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && result.failed.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <div className="mb-1 font-medium text-destructive">
            {result.failed.length}건 실패
          </div>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            {result.failed.map((f) => (
              <li key={f.pair}>
                <code className="text-[11px]">{f.pair.slice(0, 20)}…</code>{" "}
                {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && result.linked > 0 && unmatchedPairs.length === 0 && (
        <p className="text-xs text-muted-foreground">
          페이지를 새로고침하면 매칭 결과가 다시 계산됩니다.
        </p>
      )}
    </div>
  );
}
