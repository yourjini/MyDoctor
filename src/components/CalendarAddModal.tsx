"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createVisitAction } from "@/app/visits/actions";
import { createAppointmentAction } from "@/app/appointments/actions";
import { HospitalTypeSelect } from "./HospitalTypeSelect";
import { SubjectSelect } from "./SubjectSelect";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./Calendar";

// 날짜 셀 클릭 시 열리는 "구글 캘린더 스타일" 빠른 등록 모달.
// 상단 드롭다운에서 예약/방문이력을 전환하면 그에 맞는 축약 폼이 노출.
// 핵심 필드만 입력하고 저장하면 서버 액션이 레코드 생성 후 상세로 redirect.
// 첨부·세부 메모 등 심화 입력은 저장 후 상세 페이지에서.

type Kind = "visit" | "appointment";

export function CalendarAddModal({
  date,
  events,
  onClose,
}: {
  date: string;
  events: CalendarEvent[];
  onClose: () => void;
}) {
  const [kind, setKind] = useState<Kind>("visit");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-xl bg-card shadow-lg sm:rounded-xl"
      >
        {/* 헤더: 날짜 + 종류 드롭다운 + 닫기 */}
        <div className="flex items-center gap-2 border-b p-3 sm:p-4">
          <div className="shrink-0 text-sm font-semibold sm:text-base">
            {formatHeader(date)}
          </div>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
            className="min-h-11 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium"
            aria-label="등록 종류"
          >
            <option value="visit">방문이력</option>
            <option value="appointment">예약</option>
          </select>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-accent"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {kind === "visit" ? (
            <VisitQuickForm date={date} />
          ) : (
            <AppointmentQuickForm date={date} />
          )}
        </div>

        {events.length > 0 && (
          <details className="group border-t">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:bg-accent/40 sm:px-5">
              <span>이 날 등록된 일정 {events.length}건</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <ul className="divide-y border-t">
              {events.map((e) => (
                <li key={e.id}>
                  <Link
                    href={e.href}
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent/40 sm:px-5"
                  >
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                        e.type === "visit"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900",
                      )}
                    >
                      {e.type === "visit" ? "방문" : "예약"}
                    </span>
                    <span className="flex-1 truncate">{e.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      수정 →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function VisitQuickForm({ date }: { date: string }) {
  return (
    <form action={createVisitAction} className="space-y-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="blob_urls" value="" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="대상자">
          <SubjectSelect />
        </Field>
        <Field label="병원 유형">
          <HospitalTypeSelect />
        </Field>
      </div>

      <Field label="병원명" required>
        <input
          name="hospitalName"
          required
          placeholder="○○병원"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="진단명" required>
        <input
          name="diagnosis"
          required
          placeholder="예: 자궁근종 추적"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="상담 내용">
        <textarea
          name="details"
          rows={3}
          placeholder="오늘 상담 요약, 처방 등"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <p className="text-[11px] text-muted-foreground">
        첨부파일·의사 이름 등은 저장 후 상세에서 추가하세요.
      </p>

      <button
        type="submit"
        className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        방문이력 저장
      </button>
    </form>
  );
}

function AppointmentQuickForm({ date }: { date: string }) {
  return (
    <form action={createAppointmentAction} className="space-y-3">
      <input type="hidden" name="date" value={date} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="시간">
          <input
            type="time"
            name="time"
            defaultValue="09:00"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="대상자">
          <SubjectSelect />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="병원 유형">
          <HospitalTypeSelect />
        </Field>
        <Field label="병원명" required>
          <input
            name="hospitalName"
            required
            placeholder="○○병원"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="진료 목적">
        <input
          name="reason"
          placeholder="예: 정기 추적"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="주의사항">
        <textarea
          name="precautions"
          rows={2}
          placeholder="금식, 약 중단 등"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <button
        type="submit"
        className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
      >
        예약 저장
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function formatHeader(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const w = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  return `${m}/${d} (${w})`;
}
