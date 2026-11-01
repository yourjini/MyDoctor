"use client";

import { useState } from "react";
import {
  completeAppointmentAction,
  missAppointmentAction,
  reopenAppointmentAction,
} from "../../actions";
import type { Appointment, AppointmentStatus } from "@/lib/types";

// 예약 상세 상단 — 방문완료 / 비방문 토글. 방문완료 선택 시 "진료 상담
// 이력" textarea + 저장 버튼이 바로 아래 노출됨.
export function StatusControl({
  appt,
  year,
}: {
  appt: Appointment;
  year: string;
}) {
  const current: AppointmentStatus = appt.status ?? "scheduled";
  const [showComplete, setShowComplete] = useState(false);

  if (current === "completed") {
    return (
      <section className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-emerald-900">
              ✓ 방문완료 처리됨
            </div>
            {appt.completedAt && (
              <div className="mt-0.5 text-xs text-emerald-800/70">
                {appt.completedAt.slice(0, 10)}{" "}
                {appt.completedAt.slice(11, 16)} 저장
              </div>
            )}
            <div className="mt-1 text-xs text-emerald-900/80">
              방문이력이 자동 생성되어 캘린더에서 이 예약은 숨겨집니다.
            </div>
          </div>
          <form action={reopenAppointmentAction}>
            <input type="hidden" name="id" value={appt.id} />
            <input type="hidden" name="year" value={year} />
            <button
              type="submit"
              className="shrink-0 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100"
            >
              되돌리기
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (current === "missed") {
    return (
      <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-amber-900">
              — 비방문 처리됨
            </div>
            <div className="mt-1 text-xs text-amber-900/80">
              캘린더/다가오는 예약에서 숨겨집니다. 레코드는 보존되어 있어요.
            </div>
          </div>
          <form action={reopenAppointmentAction}>
            <input type="hidden" name="id" value={appt.id} />
            <input type="hidden" name="year" value={year} />
            <button
              type="submit"
              className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100"
            >
              되돌리기
            </button>
          </form>
        </div>
      </section>
    );
  }

  // scheduled
  return (
    <section className="mb-4 rounded-lg border bg-card p-4">
      <div className="mb-3 text-sm font-medium">진료 결과 처리</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowComplete((v) => !v)}
          className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {showComplete ? "× 접기" : "✓ 방문완료"}
        </button>
        <form action={missAppointmentAction}>
          <input type="hidden" name="id" value={appt.id} />
          <input type="hidden" name="year" value={year} />
          <button
            type="submit"
            onClick={(e) => {
              if (!confirm("이 예약을 비방문으로 처리할까요?")) {
                e.preventDefault();
              }
            }}
            className="inline-flex min-h-11 items-center rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            — 비방문
          </button>
        </form>
      </div>

      {showComplete && (
        <form
          action={completeAppointmentAction}
          className="mt-4 space-y-3 border-t pt-4"
        >
          <input type="hidden" name="id" value={appt.id} />
          <input type="hidden" name="year" value={year} />

          <div>
            <label className="mb-1 block text-sm font-medium">
              진단명 / 요약
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (비어두면 예약 "진료 목적" 사용)
              </span>
            </label>
            <input
              name="diagnosis"
              placeholder={appt.reason ?? "예: 자궁근종 추적"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              진료 상담 이력
            </label>
            <textarea
              name="details"
              rows={6}
              placeholder="오늘 상담 내용, 결과, 다음 일정 등"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            저장하면 방문이력이 자동 생성되고 이 예약은 "완료" 상태가 됩니다.
            첨부파일은 생성된 방문이력에서 추가하세요.
          </div>

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            방문이력 저장 + 완료 처리
          </button>
        </form>
      )}
    </section>
  );
}
