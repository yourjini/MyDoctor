"use client";

import { useMemo } from "react";
import { type CalendarEvent } from "@/components/Calendar";
import { CollapsibleCalendar } from "./CollapsibleCalendar";
import { LanhaTodayCard, type LanhaSnapshot } from "./LanhaTodayCard";
import { matchesFilter, type Person } from "@/lib/people";

export type UpcomingAppointment = {
  id: string;
  datetime: string;
  hospitalName: string;
  reason?: string;
  subject?: string;
};

export type RecentRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  kind: "visit" | "appointment" | "checkup" | "health";
  title: string;
  subject?: string;
  href: string;
};

export function DashboardView({
  subject,
  snapshot,
  calendarEvents,
  todayKey,
  dateLabel,
}: {
  subject: Person;
  snapshot: LanhaSnapshot | null;
  // upcomingAppts / recentRecords 는 사용자 요청으로 홈에서 제거됨 — 각
  // 리스트 라우트 (/appointments · /visits 등) 에서 보기.
  upcomingAppts?: UpcomingAppointment[];
  calendarEvents: CalendarEvent[];
  recentRecords?: RecentRecord[];
  todayKey: string;
  dateLabel: string;
}) {
  const visibleEvents = useMemo(
    () => calendarEvents.filter((e) => matchesFilter(e.subject, subject)),
    [calendarEvents, subject],
  );

  const monthBadge = useMemo(() => {
    const ym = todayKey.slice(0, 7);
    const count = visibleEvents.filter((e) => e.date.startsWith(ym)).length;
    return `이번 달 ${count}건`;
  }, [visibleEvents, todayKey]);

  // 전체 뷰에는 특정 인물 전용 카드를 안 띄움. 란하만 선택했을 때 노출.
  const showLanha = subject === "박란하";

  return (
    <div className="space-y-5">
      <div className="-mt-2 text-sm text-muted-foreground">
        {dateLabel}
        {subject !== "전체" && ` · ${personShort(subject)}`}
      </div>

      {/* 캘린더를 상단으로 — 날짜 셀을 탭하면 등록 모달이 바로 열림. */}
      <CollapsibleCalendar
        events={visibleEvents}
        defaultOpen={true}
        badge={monthBadge}
      />

      {showLanha && snapshot && <LanhaTodayCard snap={snapshot} />}
    </div>
  );
}

function personShort(p: Person): string {
  const map: Record<string, string> = {
    박범진: "범진",
    박란하: "란하",
    최진희: "진희",
  };
  return map[p] ?? p;
}
