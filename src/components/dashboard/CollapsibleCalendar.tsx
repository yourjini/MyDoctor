"use client";

import { useEffect, useState } from "react";
import { Calendar, type CalendarEvent } from "@/components/Calendar";

// Calendar wrapped in a collapsible disclosure. Default-collapsed on mobile
// so the dashboard's at-a-glance cards stay above the fold; default-open on
// desktop where there's enough vertical room.

export function CollapsibleCalendar({
  events,
  defaultOpen = false,
  badge,
}: {
  events: CalendarEvent[];
  defaultOpen?: boolean;
  badge?: string;
}) {
  // Mobile 디폴트는 접힘, 데스크톱(≥640px)은 펼침. 서버 렌더링은 접힘으로
  // 보수적으로 시작하고 클라이언트에서 viewport 체크 후 조정.
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 640px)");
    setOpen(mq.matches);
  }, []);

  return (
    <section className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold">캘린더</span>
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t p-2 sm:p-3">
          <Calendar events={events} />
        </div>
      )}
    </section>
  );
}
