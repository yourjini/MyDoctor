"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SubjectBadge } from "@/components/SubjectBadge";
import {
  ATTENDANCE_TAGS,
  DEPRESSIVE_TAGS,
  MANIC_TAGS,
  MENSTRUATION_LABEL,
  MOOD_TAG_GROUPS,
  SEVERITY_LABEL,
} from "@/lib/health-tags";
import { asPerson, PEOPLE, PERSON_COLORS, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";
import type { HealthLog } from "@/lib/types";

type ViewMode = "card" | "list" | "calendar" | "cloud";

const VIEW_STORAGE_KEY = "mydoctor-health-view";

const POSITIVE_TAGS = new Set(MOOD_TAG_GROUPS[0].tags);
const NEGATIVE_TAGS = new Set([
  ...MOOD_TAG_GROUPS[1].tags,
  ...MOOD_TAG_GROUPS[2].tags,
]);

export function HealthListView({ logs }: { logs: HealthLog[] }) {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "card" || saved === "calendar" || saved === "cloud") return saved;
    return "list";
  });

  function changeView(v: ViewMode) {
    setView(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, v);
    }
  }

  const byDate = useMemo(() => {
    const m = new Map<string, HealthLog[]>();
    for (const l of logs) {
      const arr = m.get(l.date) ?? [];
      arr.push(l);
      m.set(l.date, arr);
    }
    return m;
  }, [logs]);
  const dates = useMemo(
    () => Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a)),
    [byDate],
  );

  return (
    <>
      <div className="mb-3 flex items-center justify-end">
        <ViewToggle current={view} onChange={changeView} />
      </div>

      {logs.length === 0 && view !== "calendar" && view !== "cloud" ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          조건에 맞는 기록이 없습니다.
        </p>
      ) : view === "card" ? (
        <CardView dates={dates} byDate={byDate} />
      ) : view === "calendar" ? (
        <CalendarView logs={logs} />
      ) : view === "cloud" ? (
        <CloudView logs={logs} />
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
    { v: "card", label: "카드" },
    { v: "calendar", label: "달력" },
    { v: "cloud", label: "태그" },
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

function CardView({
  dates,
  byDate,
}: {
  dates: string[];
  byDate: Map<string, HealthLog[]>;
}) {
  return (
    <div className="space-y-5">
      {dates.map((d) => (
        <section key={d}>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {d}
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {byDate.get(d)!.map((l) => (
              <HealthCard key={l.id} log={l} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function HealthCard({ log }: { log: HealthLog }) {
  const year = log.date.slice(0, 4);
  const allTags = [
    ...log.bodyTags.map((t) => ({ t, kind: "body" as const })),
    ...log.moodTags.map((t) => ({ t, kind: "mood" as const })),
  ];
  const visibleTags = allTags.slice(0, 6);
  const extraCount = allTags.length - visibleTags.length;

  return (
    <Link
      href={`/health/${year}/${log.id}`}
      className="block rounded-lg border bg-card p-3 hover:bg-accent/30"
    >
      <div className="mb-2 flex items-center gap-2">
        <SubjectBadge subject={log.subject} size="sm" />
        {log.measuredAt && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
            {log.measuredAt}
          </span>
        )}
        {log.severity && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
            {SEVERITY_LABEL[log.severity]}
          </span>
        )}
      </div>

      {(log.moodScale != null || log.sleepHours != null || log.weight != null) && (
        <div className="mb-2 flex flex-wrap gap-1.5 text-[11px]">
          {log.moodScale != null && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5",
                log.moodScale > 0
                  ? "bg-orange-100 text-orange-800"
                  : log.moodScale < 0
                    ? "bg-blue-100 text-blue-800"
                    : "bg-muted",
              )}
            >
              기분 {log.moodScale > 0 ? `+${log.moodScale}` : log.moodScale}
            </span>
          )}
          {log.sleepHours != null && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
              💤 {log.sleepHours}h
            </span>
          )}
          {log.weight != null && (
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-800">
              ⚖ {log.weight}kg
            </span>
          )}
          {log.menstruation && (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900">
              생리 {MENSTRUATION_LABEL[log.menstruation]}
            </span>
          )}
        </div>
      )}

      {visibleTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {visibleTags.map(({ t, kind }) => (
            <TagPill key={`${kind}-${t}`} tag={t} kind={kind} />
          ))}
          {extraCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {log.note && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{log.note}</p>
      )}
    </Link>
  );
}

function TagPill({
  tag,
  kind,
}: {
  tag: string;
  kind: "body" | "mood";
}) {
  if (kind === "body") {
    return (
      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700">
        {tag}
      </span>
    );
  }
  const cls = ATTENDANCE_TAGS.has(tag)
    ? "bg-rose-600 text-white"
    : MANIC_TAGS.has(tag)
      ? "bg-orange-100 text-orange-800"
      : DEPRESSIVE_TAGS.has(tag)
        ? "bg-blue-100 text-blue-800"
        : "bg-indigo-50 text-indigo-700";
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", cls)}>
      {tag}
    </span>
  );
}

function ListView({
  logs,
}: {
  logs: HealthLog[];
}) {
  return (
    <ul className="overflow-hidden rounded-lg border bg-card divide-y">
      {logs.map((l) => {
        const year = l.date.slice(0, 4);
        return (
          <li key={l.id}>
            <Link
              href={`/health/${year}/${l.id}`}
              className="flex items-start gap-3 p-3 hover:bg-accent/40"
            >
              <div className="flex shrink-0 flex-col items-center gap-1">
                <SubjectBadge subject={l.subject} size="sm" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {l.date.slice(5)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {l.date.slice(0, 4)}
                  </span>
                  {l.measuredAt && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                      {l.measuredAt}
                    </span>
                  )}
                  {l.severity && (
                    <span className="rounded bg-muted px-1.5 py-0.5">
                      {SEVERITY_LABEL[l.severity]}
                    </span>
                  )}
                  {l.moodScale != null && (
                    <span
                      className={
                        l.moodScale > 0
                          ? "rounded bg-orange-100 px-1.5 py-0.5 text-orange-800"
                          : l.moodScale < 0
                            ? "rounded bg-blue-100 px-1.5 py-0.5 text-blue-800"
                            : "rounded bg-muted px-1.5 py-0.5"
                      }
                    >
                      기분 {l.moodScale > 0 ? `+${l.moodScale}` : l.moodScale}
                    </span>
                  )}
                  {l.sleepHours != null && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                      💤 {l.sleepHours}h
                    </span>
                  )}
                  {l.weight != null && (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-800">
                      ⚖ {l.weight}kg
                    </span>
                  )}
                  {l.menstruation && (
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900">
                      생리 {MENSTRUATION_LABEL[l.menstruation]}
                    </span>
                  )}
                  {l.bodyTags.map((t) => (
                    <TagPill key={`b-${t}`} tag={t} kind="body" />
                  ))}
                  {l.moodTags.map((t) => (
                    <TagPill key={`m-${t}`} tag={t} kind="mood" />
                  ))}
                </div>
                {l.note && (
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {l.note}
                  </div>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================
// 태그 클라우드 보기
//   인물별 → 카테고리별로 태그 그룹화. 빈도에 비례해 글자 크기.
//   카테고리: 조증 신호 · 우울 신호 · 출결 · 신체 · 긍정 · 부정 · 기타
//   란하/일반 모두 같은 카테고리 묶음을 사용하되 비어있는 카테고리는 숨김.
// ============================================================

type CloudCategoryKey =
  | "manic"
  | "depressive"
  | "attendance"
  | "body"
  | "positive"
  | "negative"
  | "other";

const CLOUD_CATEGORY_META: Record<
  CloudCategoryKey,
  { label: string; chip: string; text: string }
> = {
  manic: {
    label: "조증 신호",
    chip: "bg-orange-100 text-orange-800",
    text: "text-orange-700",
  },
  depressive: {
    label: "우울 신호",
    chip: "bg-blue-100 text-blue-800",
    text: "text-blue-700",
  },
  attendance: {
    label: "출결",
    chip: "bg-rose-600 text-white",
    text: "text-rose-700",
  },
  body: {
    label: "신체",
    chip: "bg-rose-50 text-rose-700",
    text: "text-rose-700",
  },
  positive: {
    label: "긍정",
    chip: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-700",
  },
  negative: {
    label: "부정·스트레스",
    chip: "bg-indigo-100 text-indigo-800",
    text: "text-indigo-700",
  },
  other: {
    label: "기타",
    chip: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
  },
};

const CATEGORY_ORDER: CloudCategoryKey[] = [
  "manic",
  "depressive",
  "attendance",
  "body",
  "positive",
  "negative",
  "other",
];

function categorizeTag(tag: string, kind: "body" | "mood"): CloudCategoryKey {
  if (kind === "body") return "body";
  if (MANIC_TAGS.has(tag)) return "manic";
  if (DEPRESSIVE_TAGS.has(tag)) return "depressive";
  if (ATTENDANCE_TAGS.has(tag)) return "attendance";
  if (POSITIVE_TAGS.has(tag)) return "positive";
  if (NEGATIVE_TAGS.has(tag)) return "negative";
  return "other";
}

function CloudView({ logs }: { logs: HealthLog[] }) {
  // person → category → tag → count
  const tally = useMemo(() => {
    const out = new Map<Person, Map<CloudCategoryKey, Map<string, number>>>();
    for (const log of logs) {
      const person = asPerson(log.subject);
      let perPerson = out.get(person);
      if (!perPerson) {
        perPerson = new Map();
        out.set(person, perPerson);
      }
      const addTag = (tag: string, kind: "body" | "mood") => {
        const cat = categorizeTag(tag, kind);
        let perCat = perPerson!.get(cat);
        if (!perCat) {
          perCat = new Map();
          perPerson!.set(cat, perCat);
        }
        perCat.set(tag, (perCat.get(tag) ?? 0) + 1);
      };
      for (const t of log.bodyTags) addTag(t, "body");
      for (const t of log.moodTags) addTag(t, "mood");
    }
    return out;
  }, [logs]);

  // PEOPLE 순서를 유지하되 실제 기록이 있는 인물만 표시
  const people = PEOPLE.filter((p) => tally.has(p));

  if (people.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        태그가 있는 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {people.map((person) => {
        const perCat = tally.get(person)!;
        const totalTags = sumAll(perCat);
        return (
          <section
            key={person}
            className="rounded-lg border bg-card p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <SubjectBadge subject={person} size="md" />
              <div>
                <div className="text-sm font-medium">{person}</div>
                <div className="text-[11px] text-muted-foreground">
                  태그 {totalTags}개
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {CATEGORY_ORDER.map((cat) => {
                const m = perCat.get(cat);
                if (!m || m.size === 0) return null;
                return (
                  <CategoryCloud
                    key={cat}
                    category={cat}
                    tags={m}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CategoryCloud({
  category,
  tags,
}: {
  category: CloudCategoryKey;
  tags: Map<string, number>;
}) {
  const meta = CLOUD_CATEGORY_META[category];
  const entries = useMemo(
    () => Array.from(tags.entries()).sort((a, b) => b[1] - a[1]),
    [tags],
  );
  const max = entries[0]?.[1] ?? 1;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-[11px]">
        <span className={cn("rounded-full px-2 py-0.5", meta.chip)}>
          {meta.label}
        </span>
        <span className="text-muted-foreground">{entries.length}종</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        {entries.map(([tag, count]) => {
          const ratio = count / max;
          return (
            <span
              key={tag}
              className={cn(
                "inline-flex items-baseline gap-1 leading-tight",
                meta.text,
                cloudSizeClass(ratio),
              )}
              title={`${tag} · ${count}회`}
            >
              <span>{tag}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {count}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function cloudSizeClass(ratio: number): string {
  if (ratio >= 0.85) return "text-2xl font-semibold";
  if (ratio >= 0.65) return "text-xl font-medium";
  if (ratio >= 0.45) return "text-lg";
  if (ratio >= 0.25) return "text-base";
  return "text-sm";
}

function sumAll(m: Map<CloudCategoryKey, Map<string, number>>): number {
  let total = 0;
  for (const cat of m.values()) {
    for (const c of cat.values()) total += c;
  }
  return total;
}

// ============================================================
// 캘린더 보기
//   월간 그리드 + 각 칸에 인물별 색 점. 박란하 점은 그날 평균
//   moodScale에 따라 색조가 변함 (조증쪽 주황, 우울쪽 파랑).
//   날짜 클릭 시 그 날 기록 카드가 캘린더 아래에 펼쳐짐.
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
  // 인물별로 묶고 각 인물당 점 1개. 박란하는 평균 moodScale 으로 색 조정.
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
        out.push({ color: lanhaMoodColor(avg), title: `박란하 기분 ${avg.toFixed(1)}` });
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
  const year = String(y);

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
            <li key={l.id}>
              <Link
                href={`/health/${year}/${l.id}`}
                className="block px-3 py-2.5 hover:bg-accent/40 sm:px-4"
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <SubjectBadge subject={l.subject} size="sm" />
                  {l.measuredAt && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                      {l.measuredAt}
                    </span>
                  )}
                  {l.severity && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      {SEVERITY_LABEL[l.severity]}
                    </span>
                  )}
                  {l.moodScale != null && (
                    <span
                      className={
                        l.moodScale > 0
                          ? "rounded bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-800"
                          : l.moodScale < 0
                            ? "rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800"
                            : "rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      }
                    >
                      기분 {l.moodScale > 0 ? `+${l.moodScale}` : l.moodScale}
                    </span>
                  )}
                  {l.sleepHours != null && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                      💤 {l.sleepHours}h
                    </span>
                  )}
                  {l.menstruation && (
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-900">
                      생리 {MENSTRUATION_LABEL[l.menstruation]}
                    </span>
                  )}
                </div>
                {(l.bodyTags.length > 0 || l.moodTags.length > 0) && (
                  <div className="mb-1 flex flex-wrap gap-1">
                    {l.bodyTags.map((t) => (
                      <TagPill key={`b-${t}`} tag={t} kind="body" />
                    ))}
                    {l.moodTags.map((t) => (
                      <TagPill key={`m-${t}`} tag={t} kind="mood" />
                    ))}
                  </div>
                )}
                {l.note && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {l.note}
                  </p>
                )}
              </Link>
            </li>
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
