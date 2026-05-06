import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import { SearchBar } from "@/components/SearchBar";
import { listHealthLogs } from "@/lib/store";
import { asPerson, matchesFilter } from "@/lib/people";
import { KIND_STYLES } from "@/lib/kinds";
import { MENSTRUATION_LABEL, SEVERITY_LABEL } from "@/lib/health-tags";
import { cn } from "@/lib/utils";
import type { HealthLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const filter = asPerson(sp.subject);
  const query = (sp.q ?? "").trim().toLowerCase();
  const all = await listHealthLogs();

  const logs = all.filter((l) => {
    if (!matchesFilter(l.subject, filter)) return false;
    if (!query) return true;
    return matches(l, query);
  });

  // group by date
  const byDate = new Map<string, HealthLog[]>();
  for (const l of logs) {
    const arr = byDate.get(l.date) ?? [];
    arr.push(l);
    byDate.set(l.date, arr);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <PageShell
      title="건강일지"
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/health/chart"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            그래프
          </Link>
          <Link
            href="/health/new"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              KIND_STYLES.health.solid,
            )}
          >
            + 새 기록
          </Link>
        </div>
      }
    >
      <div className="mb-3 space-y-2">
        <SearchBar placeholder="태그·메모 검색" />
        <SubjectFilter />
      </div>

      {logs.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {all.length === 0
            ? "기록이 없습니다. 위에서 새 기록을 추가해보세요."
            : "조건에 맞는 기록이 없습니다."}
        </p>
      ) : (
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
                        className="flex items-start gap-3 p-4 hover:bg-accent/40"
                      >
                        <SubjectBadge
                          subject={l.subject}
                          size="md"
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {l.severity && (
                              <span className="rounded bg-muted px-1.5 py-0.5">
                                컨디션 {l.severity} · {SEVERITY_LABEL[l.severity]}
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
                            {l.menstruation && (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900">
                                생리 {MENSTRUATION_LABEL[l.menstruation]}
                              </span>
                            )}
                            {l.bodyTags.map((t) => (
                              <span
                                key={`b-${t}`}
                                className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700"
                              >
                                {t}
                              </span>
                            ))}
                            {l.moodTags.map((t) => (
                              <span
                                key={`m-${t}`}
                                className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700"
                              >
                                {t}
                              </span>
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
      )}
    </PageShell>
  );
}

function matches(log: HealthLog, q: string): boolean {
  if (log.note && log.note.toLowerCase().includes(q)) return true;
  for (const t of log.bodyTags) if (t.toLowerCase().includes(q)) return true;
  for (const t of log.moodTags) if (t.toLowerCase().includes(q)) return true;
  return false;
}
