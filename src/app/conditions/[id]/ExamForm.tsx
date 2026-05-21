"use client";

import { useState } from "react";
import { EXAM_TYPES, STATUS_LIST, STATUS_META } from "@/lib/health-conditions";
import type { ConditionExam, ConditionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

// 검사 기록 추가/수정 폼. 필수는 검사일·소견 두 가지만.
export function ExamForm({
  action,
  conditionId,
  currentStatus,
  defaults,
  examId,
  lastOrg,
  onCancel,
  submitLabel = "검사 기록 저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  conditionId: string;
  currentStatus?: ConditionStatus;
  defaults?: Partial<Pick<ConditionExam, "date" | "org" | "examType" | "findings">>;
  examId?: string;
  lastOrg?: string;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [examType, setExamType] = useState<string>(defaults?.examType ?? "");
  const [changeStatus, setChangeStatus] = useState(false);

  return (
    <form action={action} className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
      <input type="hidden" name="conditionId" value={conditionId} />
      {examId && <input type="hidden" name="examId" value={examId} />}
      <input type="hidden" name="examType" value={examType} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            검사일<span className="ml-0.5 text-rose-600">*</span>
          </label>
          <input
            type="date"
            name="date"
            required
            defaultValue={defaults?.date ?? today()}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">기관</label>
          <input
            type="text"
            name="org"
            defaultValue={defaults?.org ?? ""}
            placeholder={lastOrg ? `예: ${lastOrg}` : "예: 메디스캔"}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">검사 종류</label>
        <div className="flex flex-wrap gap-1.5">
          {EXAM_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setExamType(examType === t ? "" : t)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                examType === t
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background hover:bg-accent",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          소견 · 결과<span className="ml-0.5 text-rose-600">*</span>
        </label>
        <textarea
          name="findings"
          required
          rows={4}
          defaultValue={defaults?.findings ?? ""}
          placeholder="검사 결과·소견을 적어주세요"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-6"
        />
      </div>

      {/* 검사 추가 시 상태도 함께 변경 (신규 작성일 때만) */}
      {!examId && currentStatus && (
        <div className="rounded-md bg-muted/40 p-2.5">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={changeStatus}
              onChange={(e) => setChangeStatus(e.target.checked)}
            />
            이번에 상태도 바꾸기
          </label>
          {changeStatus && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUS_LIST.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input
                    type="radio"
                    name="newStatus"
                    value={s}
                    defaultChecked={s === currentStatus}
                    className="peer sr-only"
                  />
                  <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent peer-checked:border-transparent peer-checked:bg-foreground peer-checked:text-background">
                    {STATUS_META[s].label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
