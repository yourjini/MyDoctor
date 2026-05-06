"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PEOPLE, PERSON_COLORS, type Person } from "@/lib/people";
import { MANIC_TAGS, MOOD_TAG_GROUPS } from "@/lib/health-tags";
import { cn } from "@/lib/utils";
import type { HealthLog } from "@/lib/types";

const BIPOLAR_SUBJECT = "박란하";

type RangeDays = 30 | 90 | 180;
type ChartView = "daily" | "intraday";

const POSITIVE_TAGS = new Set(MOOD_TAG_GROUPS[0].tags);
const NEGATIVE_TAGS = new Set([
  ...MOOD_TAG_GROUPS[1].tags,
  ...MOOD_TAG_GROUPS[2].tags,
]);

export function HealthChart({ logs }: { logs: HealthLog[] }) {
  const [subject, setSubject] = useState<Person>("박란하");
  const [days, setDays] = useState<RangeDays>(30);
  const [view, setView] = useState<ChartView>("daily");

  const isBipolar = subject === BIPOLAR_SUBJECT;
  const effectiveView: ChartView = isBipolar ? view : "daily";

  const { data, periodSpans } = useMemo(
    () => buildSeries(logs, subject, days, effectiveView),
    [logs, subject, days, effectiveView],
  );

  const hasData = data.some(
    (d) =>
      d.severity != null ||
      d.mood != null ||
      d.moodScale != null ||
      d.sleepHours != null ||
      d.menstruation,
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
        {isBipolar && (
          <>
            <span className="mx-2 h-5 w-px bg-border" />
            <div className="flex gap-1.5">
              {(["daily", "intraday"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs",
                    view === v
                      ? "bg-foreground text-background"
                      : "bg-background hover:bg-accent",
                  )}
                >
                  {v === "daily" ? "일별" : "시간별"}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {!hasData ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {subject}의 기록이 이 기간에 없습니다.
        </p>
      ) : (
        <>
          {isBipolar && (
            <>
              <ChartCard title="조증/우울 스케일 (-5 우울 ~ +5 조증)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={data}
                    margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} />
                    <YAxis
                      domain={[-5, 5]}
                      ticks={[-5, -3, 0, 3, 5]}
                      fontSize={11}
                    />
                    <Tooltip content={<DayTooltip />} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                    <ReferenceArea
                      y1={0}
                      y2={5}
                      fill="#fb923c"
                      fillOpacity={0.06}
                      ifOverflow="visible"
                    />
                    <ReferenceArea
                      y1={-5}
                      y2={0}
                      fill="#3b82f6"
                      fillOpacity={0.06}
                      ifOverflow="visible"
                    />
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
                      dataKey="moodScale"
                      stroke="#9333ea"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="수면시간 (조증 조기 신호)">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={data}
                    margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} />
                    <YAxis domain={[0, 12]} ticks={[0, 4, 6, 8, 10, 12]} fontSize={11} />
                    <Tooltip content={<DayTooltip />} />
                    <ReferenceLine
                      y={6}
                      stroke="#dc2626"
                      strokeDasharray="3 3"
                      label={{
                        value: "6h",
                        fontSize: 10,
                        fill: "#dc2626",
                        position: "right",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sleepHours"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="조증 신호 태그 개수">
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart
                    data={data}
                    margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} />
                    <Tooltip content={<DayTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="manicCount"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

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
  moodScale: number | null;
  sleepHours: number | null;
  manicCount: number | null;
  menstruation: boolean;
  bodyTags: string[];
  moodTags: string[];
};

function buildSeries(
  logs: HealthLog[],
  subject: Person,
  days: number,
  view: ChartView = "daily",
): { data: Point[]; periodSpans: { start: string; end: string }[] } {
  // Filter to subject (subject-only — chart needs single person resolution).
  const filtered = logs.filter((l) => (l.subject ?? "전체") === subject);

  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const startStr = toDateStr(start);

  if (view === "intraday") {
    return buildIntradaySeries(filtered, startStr);
  }

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
        moodScale: null,
        sleepHours: null,
        manicCount: null,
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

    // 박란하 추가 데이터
    const moodScales = dayLogs
      .map((l) => l.moodScale)
      .filter((n): n is number => typeof n === "number");
    const avgMoodScale =
      moodScales.length > 0
        ? moodScales.reduce((a, b) => a + b, 0) / moodScales.length
        : null;
    const sleepValues = dayLogs
      .map((l) => l.sleepHours)
      .filter((n): n is number => typeof n === "number");
    const avgSleep =
      sleepValues.length > 0
        ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
        : null;
    let manicCount = 0;
    let hasManic = false;
    for (const l of dayLogs) {
      for (const t of l.moodTags) {
        if (MANIC_TAGS.has(t)) {
          manicCount += 1;
          hasManic = true;
        }
      }
    }

    data.push({
      date: dateStr,
      severity: avgSeverity,
      mood: hasMood ? mood : null,
      moodScale: avgMoodScale,
      sleepHours: avgSleep,
      manicCount: hasManic ? manicCount : null,
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

function buildIntradaySeries(
  filtered: HealthLog[],
  startStr: string,
): { data: Point[]; periodSpans: { start: string; end: string }[] } {
  const inRange = filtered.filter((l) => l.date >= startStr);
  // Sort by date + time (createdAt fallback for time)
  const sorted = inRange.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const at = a.measuredAt ?? a.createdAt.slice(11, 16);
    const bt = b.measuredAt ?? b.createdAt.slice(11, 16);
    return at.localeCompare(bt);
  });

  const data: Point[] = sorted.map((l) => {
    const time = l.measuredAt ?? l.createdAt.slice(11, 16);
    const [, m, d] = l.date.split("-");
    const label = `${Number(m)}/${Number(d)} ${time}`;
    let manic = 0;
    let hasManic = false;
    for (const t of l.moodTags) {
      if (MANIC_TAGS.has(t)) {
        manic += 1;
        hasManic = true;
      }
    }
    let mood = 0;
    let hasMood = false;
    for (const t of l.moodTags) {
      if (POSITIVE_TAGS.has(t)) {
        mood += 1;
        hasMood = true;
      } else if (NEGATIVE_TAGS.has(t)) {
        mood -= 1;
        hasMood = true;
      }
    }
    return {
      date: label,
      severity: l.severity ?? null,
      mood: hasMood ? mood : null,
      moodScale: l.moodScale ?? null,
      sleepHours: l.sleepHours ?? null,
      manicCount: hasManic ? manic : null,
      menstruation: !!l.menstruation,
      bodyTags: l.bodyTags,
      moodTags: l.moodTags,
    };
  });

  // intraday view: skip menstruation reference areas (date keys don't match)
  return { data, periodSpans: [] };
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
  // YYYY-MM-DD → M/D, intraday "M/D HH:MM" → return as-is
  if (s.includes(" ")) return s;
  if (s.includes("-")) {
    const [, m, d] = s.split("-");
    return `${Number(m)}/${Number(d)}`;
  }
  return s;
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
      {p.moodScale != null && (
        <div>
          조증/우울:{" "}
          <span
            className={
              p.moodScale > 0
                ? "text-orange-700"
                : p.moodScale < 0
                  ? "text-blue-700"
                  : ""
            }
          >
            {p.moodScale > 0 ? `+${p.moodScale.toFixed(1)}` : p.moodScale.toFixed(1)}
          </span>
        </div>
      )}
      {p.sleepHours != null && <div>수면: {p.sleepHours.toFixed(1)}h</div>}
      {p.manicCount != null && <div>조증 신호: {p.manicCount}개</div>}
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
