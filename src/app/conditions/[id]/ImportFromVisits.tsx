"use client";

import { useState } from "react";
import { importVisitAsExamAction } from "../actions";

export type ImportCandidate = {
  year: string;
  id: string;
  date: string; // YYYY-MM-DD
  hospitalType: string;
  hospitalName: string;
  diagnosis: string;
  detailsPreview: string;
};

export function ImportFromVisits({
  conditionId,
  candidates,
}: {
  conditionId: string;
  candidates: ImportCandidate[];
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (candidates.length === 0) {
    return (
      <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
        가져올 수 있는 방문이력이 없습니다. (같은 사람의 아직 연결 안 된 방문
        레코드 없음)
      </div>
    );
  }

  const refValue = Array.from(checked).join(",");

  function toggle(ref: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }

  function toggleAll() {
    if (checked.size === candidates.length) setChecked(new Set());
    else setChecked(new Set(candidates.map((c) => `${c.year}:${c.id}`)));
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 w-full rounded-md border border-dashed bg-background px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
      >
        + 방문이력에서 가져오기 ({candidates.length}건 매칭)
      </button>
    );
  }

  return (
    <form action={importVisitAsExamAction} className="space-y-3">
      <input type="hidden" name="conditionId" value={conditionId} />
      <input type="hidden" name="visitRefs" value={refValue} />

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          가져올 방문이력 선택
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({checked.size} / {candidates.length})
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={toggleAll}
            className="min-h-11 rounded-md border bg-background px-2.5 py-1 text-xs hover:bg-accent"
          >
            {checked.size === candidates.length ? "전체 해제" : "전체 선택"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setChecked(new Set());
            }}
            className="min-h-11 rounded-md border bg-background px-2.5 py-1 text-xs hover:bg-accent"
          >
            접기
          </button>
        </div>
      </div>

      <ul className="divide-y rounded-md border bg-background">
        {candidates.map((c) => {
          const ref = `${c.year}:${c.id}`;
          const isChecked = checked.has(ref);
          return (
            <li key={ref}>
              <label className="flex cursor-pointer items-start gap-3 p-3 text-sm hover:bg-accent/40">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(ref)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {c.hospitalType}
                    </span>
                    <span className="font-medium">{c.hospitalName}</span>
                    <span className="text-xs text-muted-foreground">
                      · {c.date}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-foreground/80">
                    {c.diagnosis}
                  </div>
                  {c.detailsPreview && (
                    <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {c.detailsPreview}
                    </div>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={checked.size === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {checked.size === 0
            ? "선택한 방문 없음"
            : `${checked.size}건 가져오기`}
        </button>
        <p className="text-[11px] text-muted-foreground">
          선택한 방문이 "검사 이력" 으로 추가되고 "마지막 검사" 날짜가
          갱신됩니다.
        </p>
      </div>
    </form>
  );
}
