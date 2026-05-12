"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SubjectBadge } from "@/components/SubjectBadge";
import {
  ATTENDANCE_TAGS,
  DEPRESSIVE_TAGS,
  MANIC_TAGS,
  MENSTRUATION_LABEL,
  SEVERITY_LABEL,
} from "@/lib/health-tags";
import { cn } from "@/lib/utils";
import type { HealthLog } from "@/lib/types";

type ViewMode = "card" | "list";

const VIEW_STORAGE_KEY = "mydoctor-health-view";

export function HealthListView({ logs }: { logs: HealthLog[] }) {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card";
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "list" ? "list" : "card";
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

      {logs.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          조건에 맞는 기록이 없습니다.
        </p>
      ) : view === "card" ? (
        <CardView dates={dates} byDate={byDate} />
      ) : (
        <ListView dates={dates} byDate={byDate} />
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
  return (
    <div
      className="inline-flex rounded-md border bg-background p-0.5 text-xs"
      role="tablist"
    >
      {(["card", "list"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={current === v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded px-2.5 py-1 transition-colors",
            current === v
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {v === "card" ? "카드" : "목록"}
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
          <ul className="rounded-lg border bg-card divide-y">
            {byDate.get(d)!.map((l) => {
              const year = d.slice(0, 4);
              return (
                <li key={l.id}>
                  <Link
                    href={`/health/${year}/${l.id}`}
                    className="flex items-start gap-3 p-3 hover:bg-accent/40"
                  >
                    <SubjectBadge
                      subject={l.subject}
                      size="md"
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
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
                            {l.moodScale > 0 ? `+${l.moodScale}` : l.moodScale}
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
                        <div className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                          {l.note}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
