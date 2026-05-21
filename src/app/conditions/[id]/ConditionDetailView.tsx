"use client";

import { useState } from "react";
import { SubjectBadge } from "@/components/SubjectBadge";
import { STATUS_LIST, STATUS_META } from "@/lib/health-conditions";
import { cn } from "@/lib/utils";
import type { ConditionExam, HealthCondition } from "@/lib/types";
import { ConditionForm } from "../ConditionForm";
import { ExamForm } from "./ExamForm";
import {
  createExamAction,
  deleteConditionAction,
  deleteExamAction,
  setConditionStatusAction,
  updateConditionAction,
  updateExamAction,
} from "../actions";

export function ConditionDetailView({
  condition,
  exams,
}: {
  condition: HealthCondition;
  exams: ConditionExam[];
}) {
  const [editingCondition, setEditingCondition] = useState(false);
  const [addingExam, setAddingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const meta = STATUS_META[condition.status];
  const lastOrg = exams[0]?.org;

  if (editingCondition) {
    return (
      <ConditionForm
        action={updateConditionAction}
        defaults={{
          subject: condition.subject,
          bodyPart: condition.bodyPart,
          diagnosis: condition.diagnosis,
          status: condition.status,
          summary: condition.summary,
          nextAction: condition.nextAction,
          nextDate: condition.nextDate,
        }}
        hiddenInputs={{ id: condition.id }}
        submitLabel="수정 저장"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <article className="space-y-3 rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <SubjectBadge subject={condition.subject} size="md" />
          <h1 className="text-xl font-semibold">{condition.bodyPart}</h1>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", meta.chip)}>
            {meta.label}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">{condition.diagnosis}</div>

        {condition.summary && (
          <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm leading-6">
            {condition.summary}
          </p>
        )}
        {condition.nextAction && (
          <div className="text-sm font-medium text-amber-700">
            📅 다음: {condition.nextAction}
            {condition.nextDate && ` · ${condition.nextDate}`}
          </div>
        )}

        {/* 상태 빠른 변경 */}
        <div>
          <div className="mb-1 text-xs text-muted-foreground">상태 바꾸기</div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_LIST.map((s) => (
              <form key={s} action={setConditionStatusAction}>
                <input type="hidden" name="id" value={condition.id} />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    condition.status === s
                      ? STATUS_META[s].chip + " border-transparent"
                      : "bg-background hover:bg-accent",
                  )}
                >
                  {STATUS_META[s].label}
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEditingCondition(true)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            질환 정보 수정
          </button>
          <form action={deleteConditionAction}>
            <input type="hidden" name="id" value={condition.id} />
            <button
              type="submit"
              className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
              onClick={(e) => {
                if (!confirm("이 질환과 검사 이력을 모두 삭제할까요?")) {
                  e.preventDefault();
                }
              }}
            >
              삭제
            </button>
          </form>
        </div>
      </article>

      {/* 검사 이력 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            검사 기록 <span className="text-muted-foreground">({exams.length}건)</span>
          </h2>
          {!addingExam && (
            <button
              type="button"
              onClick={() => {
                setAddingExam(true);
                setEditingExamId(null);
              }}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + 검사 기록 추가
            </button>
          )}
        </div>

        {addingExam && (
          <div className="mb-3">
            <ExamForm
              action={createExamAction}
              conditionId={condition.id}
              currentStatus={condition.status}
              lastOrg={lastOrg}
              onCancel={() => setAddingExam(false)}
            />
          </div>
        )}

        {exams.length === 0 && !addingExam ? (
          <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            아직 검사 기록이 없습니다.
          </p>
        ) : (
          <ol className="space-y-2">
            {exams.map((ex) => (
              <li key={ex.id}>
                {editingExamId === ex.id ? (
                  <ExamForm
                    action={updateExamAction}
                    conditionId={condition.id}
                    examId={ex.id}
                    defaults={{
                      date: ex.date,
                      org: ex.org,
                      examType:
                        typeof ex.examType === "string" ? ex.examType : "",
                      findings: ex.findings,
                    }}
                    onCancel={() => setEditingExamId(null)}
                    submitLabel="검사 기록 수정"
                  />
                ) : (
                  <ExamCard
                    exam={ex}
                    conditionId={condition.id}
                    onEdit={() => {
                      setEditingExamId(ex.id);
                      setAddingExam(false);
                    }}
                  />
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function ExamCard({
  exam,
  conditionId,
  onEdit,
}: {
  exam: ConditionExam;
  conditionId: string;
  onEdit: () => void;
}) {
  const sub = [exam.examType, exam.org].filter(Boolean).join(" · ");
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="font-mono text-sm font-medium">{exam.date}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
          >
            수정
          </button>
          <form action={deleteExamAction}>
            <input type="hidden" name="conditionId" value={conditionId} />
            <input type="hidden" name="examId" value={exam.id} />
            <button
              type="submit"
              className="rounded px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50"
              onClick={(e) => {
                if (!confirm("이 검사 기록을 삭제할까요?")) e.preventDefault();
              }}
            >
              삭제
            </button>
          </form>
        </div>
      </div>
      <p className="whitespace-pre-wrap pl-4 text-sm leading-6 text-foreground/90">
        {exam.findings}
      </p>
    </div>
  );
}
