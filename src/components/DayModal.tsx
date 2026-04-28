"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./Calendar";

export function DayModal({
  date,
  events,
  onClose,
}: {
  date: string;
  events: CalendarEvent[];
  onClose: () => void;
}) {
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

  const visits = events.filter((e) => e.type === "visit");
  const appts = events.filter((e) => e.type === "appointment");

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-xl bg-card p-4 shadow-lg sm:rounded-xl sm:p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold sm:text-lg">
            {formatHeader(date)}
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1.5 text-muted-foreground hover:bg-accent"
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

        {events.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            이 날 등록된 일정이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {appts.length > 0 && (
              <Section title="예약" color="amber">
                {appts.map((e) => (
                  <EntryLink key={e.id} event={e} />
                ))}
              </Section>
            )}
            {visits.length > 0 && (
              <Section title="방문 이력" color="emerald">
                {visits.map((e) => (
                  <EntryLink key={e.id} event={e} />
                ))}
              </Section>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row">
          <AddButton href={`/visits/new?date=${date}`} label="방문 추가" />
          <AddButton
            href={`/appointments/new?date=${date}`}
            label="예약 추가"
          />
          <AddButton href={`/checkups/new?date=${date}`} label="검진 추가" />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: "amber" | "emerald";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            color === "amber" ? "bg-amber-400" : "bg-emerald-400",
          )}
        />
        {title}
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function EntryLink({ event }: { event: CalendarEvent }) {
  return (
    <li>
      <Link
        href={event.href}
        className={cn(
          "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent",
          event.type === "visit"
            ? "border-emerald-200"
            : "border-amber-200",
        )}
      >
        <span className="truncate">{event.title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">수정</span>
      </Link>
    </li>
  );
}

function AddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
    >
      + {label}
    </Link>
  );
}

function formatHeader(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const w = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  return `${y}년 ${m}월 ${d}일 (${w})`;
}
