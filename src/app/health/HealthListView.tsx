"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SubjectBadge } from "@/components/SubjectBadge";
import { asPerson, PEOPLE, PERSON_COLORS, type Person } from "@/lib/people";
import {
  ATTENDANCE_TAGS,
  DEPRESSIVE_TAGS,
  MANIC_TAGS,
  MENSTRUATION_LABEL,
  SEVERITY_LABEL,
} from "@/lib/health-tags";
import { cn } from "@/lib/utils";
import type { HealthLog } from "@/lib/types";

type ViewMode = "list" | "calendar";

const VIEW_STORAGE_KEY = "mydoctor-health-view";

export function HealthListView({ logs }: { logs: HealthLog[] }) {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "calendar" ? "calendar" : "list";
  });

  function changeView(v: ViewMode) {
    setView(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, v);
    }
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-end">
        <ViewToggle current={view} onChange={changeView} />
      </div>

      {view === "calendar" ? (
        <CalendarView logs={logs} />
      ) : logs.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          조건에 맞는 기록이 없습니다.
        </p>
      ) : (
        <ListView logs={logs} />
      )}
    </>
  );
}

function ViewToggle({
  current,
  onChange,
}: {
  current: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const opts: { v: ViewMode; label: string }[] = [
    { v: "list", label: "목록" },
    { v: "calendar", label: "달력" },
  ];
  return (
    <div
      className="inline-flex rounded-md border bg-background p-0.5 text-xs"
      role="tablist"
    >
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="tab"
          aria-selected={current === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded px-2.5 py-1 transition-colors",
            current === o.v
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 목록 — 한 줄에 3요소: 인물/날짜 · 한 줄 요약 · 메모/태그수
// ============================================================

function ListView({ logs }: { logs: HealthLog[] }) {
  return (
    <ul className="overflow-hidden rounded-lg border bg-card divide-y">
      {logs.map((l) => (
        <LogRow key={l.id} log={l} />
      ))}
    </ul>
  );
}

function LogRow({ log }: { log: HealthLog }) {
  const year = log.date.slice(0, 4);
  const summary = oneLineSummary(log);
  const tagCount = log.bodyTags.length + log.moodTags.length;

  return (
    <li>
      <Link
        href={`/health/${year}/${log.id}`}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 sm:px-4"
      >
        {/* 좌: 인물 점 + 날짜 */}
        <div className="flex w-14 shrink-0 flex-col items-center gap-0.5">
          <SubjectBadge subject={log.subject} size="sm" />
          <span className="font-mono text-[10px] text-muted-foreground">
            {log.date.slice(5)}
          </span>
        </div>

        {/* 중: 한 줄 요약 + 메모 미리보기 */}
        <div className="min-w-0 flex-1">
          {summary && (
            <div className="text-sm leading-snug text-foreground/90">
              {summary}
            </div>
          )}
          {log.note && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {log.note}
            </p>
          )}
          {!summary && !log.note && (
            <span className="text-xs text-muted-foreground italic">
              (내용 없음)
            </span>
          )}
        </div>

        {/* 우: 위험 신호 점 · 태그 개수 */}
        <div className="flex shrink-0 items-center gap-1.5">
          {hasRedFlag(log) && (
            <span
              className="h-2 w-2 rounded-full bg-red-500"
              title="주의 신호 있음"
            />
          )}
          {tagCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              태그 {tagCount}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

// 숫자/스칼라 데이터를 한 줄 텍스트로. "기분 +3 · 잠 5h · 체중 78kg · 컨디션 안좋음"
function oneLineSummary(log: HealthLog): string {
  const parts: string[] = [];

  if (log.moodScale != null) {
    const sign = log.moodScale > 0 ? "+" : "";
    parts.push(`기분 ${sign}${log.moodScale}`);
  }
  if (log.sleepHours != null) parts.push(`잠 ${log.sleepHours}h`);
  if (log.weight != null) parts.push(`체중 ${log.weight}kg`);
  if (log.severity) parts.push(SEVERITY_LABEL[log.severity]);
  if (log.menstruation) parts.push(`생리 ${MENSTRUATION_LABEL[log.menstruation]}`);
  if (log.measuredAt) parts.push(log.measuredAt);

  return parts.join(" · ");
}

// 출결 이상이나 자살 생각 같은 강한 신호가 있으면 우측에 작은 빨간 점.
function hasRedFlag(log: HealthLog): boolean {
  for (const t of log.moodTags) {
    if (ATTENDANCE_TAGS.has(t)) return true;
    if (t === "자살 생각") return true;
  }
  return false;
}

// ============================================================
// 캘린더 — 월간 그리드, 각 칸에 인물별 색 점
// ============================================================

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function CalendarView({ logs }: { logs: HealthLog[] }) {
  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month0: d.getMonth(),
      key: ymd(d),
    };
  }, []);
  const [cursor, setCursor] = useState(new Date(today.year, today.month0, 1));
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, HealthLog[]>();
    for (const l of logs) {
      const arr = m.get(l.date) ?? [];
      arr.push(l);
      m.set(l.date, arr);
    }
    return m;
  }, [logs]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2 sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="rounded p-1.5 hover:bg-accent"
            aria-label="이전 달"
          >
            ‹
          </button>
          <div className="font-medium text-sm sm:text-base">{monthLabel}</div>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="rounded p-1.5 hover:bg-accent"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 border-b text-center text-[10px] text-muted-foreground sm:text-xs">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "py-1.5 sm:py-2",
                i === 0 && "text-red-500",
                i === 6 && "text-blue-500",
              )}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((day, idx) => {
            const key = ymd(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = key === today.key;
            const isSelected = key === selected;
            const dayLogs = byDate.get(key) ?? [];
            const dots = computeDots(dayLogs);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "group min-h-[52px] border-b border-r p-1 text-left transition-colors hover:bg-accent/40 focus:bg-accent/60 focus:outline-none sm:min-h-[68px] sm:p-1.5",
                  idx % 7 === 6 && "border-r-0",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                  isSelected && "bg-accent/60 ring-1 ring-inset ring-foreground/30",
                )}
              >
                <div
                  className={cn(
                    "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    isToday && "bg-primary text-primary-foreground font-medium",
                  )}
                >
                  {day.getDate()}
                </div>
                {dots.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {dots.map((d, i) => (
                      <span
                        key={i}
                        className={cn("h-2 w-2 rounded-full", d.color)}
                        title={d.title}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground sm:px-4 sm:text-xs">
          {(["박란하", "박범진", "최진희"] as const).map((p) => (
            <span key={p} className="inline-flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-full", PERSON_COLORS[p].dot)} />
              {p}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            란하 조증쪽
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            란하 우울쪽
          </span>
        </div>
      </div>

      {selected && (
        <SelectedDayPanel
          date={selected}
          logs={byDate.get(selected) ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

type Dot = { color: string; title: string };

function computeDots(dayLogs: HealthLog[]): Dot[] {
  if (dayLogs.length === 0) return [];
  // 인물별로 묶고 각 인물당 점 1개. 박란하는 평균 moodScale로 색 조정.
  const perPerson = new Map<Person, HealthLog[]>();
  for (const l of dayLogs) {
    const p = asPerson(l.subject);
    const arr = perPerson.get(p) ?? [];
    arr.push(l);
    perPerson.set(p, arr);
  }

  const out: Dot[] = [];
  for (const p of PEOPLE) {
    const list = perPerson.get(p);
    if (!list || list.length === 0) continue;
    if (p === "박란하") {
      const scales = list
        .map((l) => l.moodScale)
        .filter((n): n is number => typeof n === "number");
      if (scales.length > 0) {
        const avg = scales.reduce((a, b) => a + b, 0) / scales.length;
        out.push({
          color: lanhaMoodColor(avg),
          title: `박란하 기분 ${avg.toFixed(1)}`,
        });
        continue;
      }
      out.push({ color: PERSON_COLORS[p].dot, title: "박란하" });
    } else {
      out.push({ color: PERSON_COLORS[p].dot, title: p });
    }
  }
  return out;
}

function lanhaMoodColor(scale: number): string {
  if (scale >= 3) return "bg-orange-600";
  if (scale >= 1) return "bg-orange-400";
  if (scale <= -3) return "bg-blue-600";
  if (scale <= -1) return "bg-blue-400";
  return PERSON_COLORS["박란하"].dot; // pink-500
}

function SelectedDayPanel({
  date,
  logs,
  onClose,
}: {
  date: string;
  logs: HealthLog[];
  onClose: () => void;
}) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const w = WEEKDAYS[dt.getDay()];

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2 sm:px-4 sm:py-3">
        <div className="text-sm font-semibold sm:text-base">
          {y}년 {m}월 {d}일 ({w})
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/health/new?date=${date}`}
            className="rounded-md bg-pink-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-pink-700"
          >
            + 기록
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-muted-foreground hover:bg-accent"
          >
            <svg
              width="16"
              height="16"
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
      </div>

      {logs.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground sm:px-4">
          이 날 기록이 없습니다.
        </p>
      ) : (
        <ul className="divide-y">
          {logs.map((l) => (
            <LogRow key={l.id} log={l} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function buildMonthGrid(cursor: Date): Date[] {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = firstOfMonth.getDay();
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - startWeekday);
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}
