"use client";

import { useMemo, useState } from "react";
import { cn, todayKST } from "@/lib/utils";
import { DayModal } from "./DayModal";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: "visit" | "appointment";
  href: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function Calendar({ events }: { events: CalendarEvent[] }) {
  const today = todayKST();
  const [cursor, setCursor] = useState(
    new Date(today.year, today.month0, 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;
  const todayKey = today.key;

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2 sm:px-4 sm:py-3">
          <button
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="rounded p-1.5 hover:bg-accent"
            aria-label="이전 달"
          >
            ‹
          </button>
          <div className="font-medium text-sm sm:text-base">{monthLabel}</div>
          <button
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
            const isToday = key === todayKey;
            const dayEvents = eventsByDate.get(key) ?? [];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={cn(
                  "group min-h-[56px] border-b border-r p-1 text-left text-[11px] transition-colors hover:bg-accent/40 focus:bg-accent/60 focus:outline-none sm:min-h-[80px] sm:p-1.5 sm:text-xs",
                  idx % 7 === 6 && "border-r-0",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "mb-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] sm:mb-1",
                    isToday &&
                      "bg-primary text-primary-foreground font-medium",
                  )}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[10px] leading-tight sm:text-[11px]",
                        e.type === "visit"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900",
                      )}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground sm:px-4 sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            방문이력
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            예약
          </span>
          <span className="ml-auto hidden text-muted-foreground/70 sm:inline">
            날짜를 탭하면 추가/수정 메뉴가 열립니다
          </span>
        </div>
      </div>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          events={eventsByDate.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
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
