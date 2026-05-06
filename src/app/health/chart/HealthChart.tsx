"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PEOPLE, PERSON_COLORS, type Person } from "@/lib/people";
import { MOOD_TAG_GROUPS } from "@/lib/health-tags";
import { cn } from "@/lib/utils";
import type { HealthLog } from "@/lib/types";

type RangeDays = 30 | 90 | 180;

const POSITIVE_TAGS = new Set(MOOD_TAG_GROUPS[0].tags);
const NEGATIVE_TAGS = new Set([
  ...MOOD_TAG_GROUPS[1].tags,
  ...MOOD_TAG_GROUPS[2].tags,
]);

export function HealthChart({ logs }: { logs: HealthLog[] }) {
  const [subject, setSubject] = useState<Person>("박란하");
  const [days, setDays] = useState<RangeDays>(30);

  const { data, periodSpans } = useMemo(
    () => buildSeries(logs, subject, days),
    [logs, subject, days],
  );

  const hasData = data.some(
    (d) => d.severity != null || d.mood != null || d.menstruation,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PEOPLE.filter((p) => p !== "전체").map((p) => {
            const colors = PERSON_COLORS[p];
            const active = subject === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSubject(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active ? colors.pillActive : colors.pill,
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
        <span className="mx-2 h-5 w-px bg-border" />
        <div className="flex gap-1.5">
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d as RangeDays)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs",
                days === d
                  ? "bg-foreground text-background"
                  : "bg-background hover:bg-accent",
              )}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {subject}의 기록이 이 기간에 없습니다.
        </p>
      ) : (
        <>
          <ChartCard title="컨디션 (1=좋음 ~ 5=안좋음)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={11} reversed />
                <Tooltip content={<DayTooltip />} />
                {periodSpans.map((s, i) => (
                  <ReferenceArea
                    key={`p-${i}`}
                    x1={s.start}
                    x2={s.end}
                    fill="#fb7185"
                    fillOpacity={0.12}
                    ifOverflow="visible"
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="severity"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="기분 (+긍정 / −부정)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip content={<DayTooltip />} />
                {periodSpans.map((s, i) => (
                  <ReferenceArea
                    key={`p-${i}`}
                    x1={s.start}
                    x2={s.end}
                    fill="#fb7185"
                    fillOpacity={0.12}
                    ifOverflow="visible"
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <p className="text-xs text-muted-foreground">
            분홍 음영 = 생리기간 · 점이 끊어진 곳은 그 날 기록 없음
          </p>
        </>
      )}
    </div>
  );
}

type Point = {
  date: string;
  severity: number | null;
  mood: number | null;
  menstruation: boolean;
  bodyTags: string[];
  moodTags: string[];
};

function buildSeries(
  logs: HealthLog[],
  subject: Person,
  days: number,
): { data: Point[]; periodSpans: { start: string; end: string }[] } {
  // Filter to subject (subject-only — chart needs single person resolution).
  const filtered = logs.filter((l) => (l.subject ?? "전체") === subject);

  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  // Aggregate per date
  const byDate = new Map<string, HealthLog[]>();
  for (const l of filtered) {
    if (!byDate.has(l.date)) byDate.set(l.date, []);
    byDate.get(l.date)!.push(l);
  }

  const data: Point[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = toDateStr(d);
    const dayLogs = byDate.get(dateStr) ?? [];
    if (dayLogs.length === 0) {
      data.push({
        date: dateStr,
        severity: null,
        mood: null,
        menstruation: false,
        bodyTags: [],
        moodTags: [],
      });
      continue;
    }
    const severities = dayLogs.map((l) => l.severity).filter((s): s is number => !!s);
    const avgSeverity =
      severities.length > 0
        ? severities.reduce((a, b) => a + b, 0) / severities.length
        : null;

    let mood = 0;
    let hasMood = false;
    for (const l of dayLogs) {
      for (const t of l.moodTags) {
        if (POSITIVE_TAGS.has(t)) {
          mood += 1;
          hasMood = true;
        } else if (NEGATIVE_TAGS.has(t)) {
          mood -= 1;
          hasMood = true;
        }
      }
    }

    const allBody = new Set<string>();
    const allMood = new Set<string>();
    for (const l of dayLogs) {
      l.bodyTags.forEach((t) => allBody.add(t));
      l.moodTags.forEach((t) => allMood.add(t));
    }

    data.push({
      date: dateStr,
      severity: avgSeverity,
      mood: hasMood ? mood : null,
      menstruation: dayLogs.some((l) => !!l.menstruation),
      bodyTags: Array.from(allBody),
      moodTags: Array.from(allMood),
    });
  }

  // Build period spans (consecutive menstruation days)
  const periodSpans: { start: string; end: string }[] = [];
  let runStart: string | null = null;
  let runEnd: string | null = null;
  for (const p of data) {
    if (p.menstruation) {
      if (runStart == null) runStart = p.date;
      runEnd = p.date;
    } else if (runStart && runEnd) {
      periodSpans.push({ start: runStart, end: runEnd });
      runStart = null;
      runEnd = null;
    }
  }
  if (runStart && runEnd) periodSpans.push({ start: runStart, end: runEnd });

  return { data, periodSpans };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDate(s: string): string {
  // YYYY-MM-DD → M/D
  const [, m, d] = s.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

function DayTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded border bg-background p-2 text-xs shadow-md">
      <div className="font-medium">{p.date}</div>
      {p.severity != null && (
        <div>컨디션: {p.severity.toFixed(1)}</div>
      )}
      {p.mood != null && <div>기분 점수: {p.mood > 0 ? "+" : ""}{p.mood}</div>}
      {p.menstruation && <div className="text-rose-600">생리</div>}
      {p.bodyTags.length > 0 && (
        <div className="mt-1 max-w-[200px]">
          <span className="text-muted-foreground">증상:</span>{" "}
          {p.bodyTags.join(", ")}
        </div>
      )}
      {p.moodTags.length > 0 && (
        <div className="max-w-[200px]">
          <span className="text-muted-foreground">기분:</span>{" "}
          {p.moodTags.join(", ")}
        </div>
      )}
    </div>
  );
}
