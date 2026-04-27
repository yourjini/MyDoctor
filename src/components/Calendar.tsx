"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: "visit" | "appointment";
  href: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function Calendar({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

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
  const todayKey = ymd(today);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="rounded p-1.5 hover:bg-accent"
          aria-label="이전 달"
        >
          ‹
        </button>
        <div className="font-medium">{monthLabel}</div>
        <button
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="rounded p-1.5 hover:bg-accent"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "py-2",
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
            <div
              key={idx}
              className={cn(
                "min-h-[80px] border-b border-r p-1 text-xs",
                idx % 7 === 6 && "border-r-0",
                !inMonth && "bg-muted/30 text-muted-foreground",
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
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    href={e.href}
                    className={cn(
                      "block truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                      e.type === "visit"
                        ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-900 hover:bg-amber-200",
                    )}
                    title={e.title}
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t px-4 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          방문이력
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          예약
        </span>
      </div>
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
