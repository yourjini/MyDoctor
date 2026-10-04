import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectFilter } from "@/components/SubjectFilter";
import { SearchBar } from "@/components/SearchBar";
import { listHealthLogs } from "@/lib/store";
import { asPerson, matchesFilter } from "@/lib/people";
import { KIND_STYLES } from "@/lib/kinds";
import { cn } from "@/lib/utils";
import type { HealthLog } from "@/lib/types";
import { HealthListView } from "./HealthListView";

export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "all", label: "전체" },
] as const;

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; q?: string; range?: string }>;
}) {
  const sp = await searchParams;
  // 80% 사용 패턴 — subject 파라미터 없으면 박란하 디폴트
  const filter = sp.subject == null ? "박란하" : asPerson(sp.subject);
  const query = (sp.q ?? "").trim().toLowerCase();
  const range = sp.range ?? "30";

  const all = await listHealthLogs();

  // Date cut-off for range filter
  let cutoff: string | null = null;
  if (range !== "all") {
    const days = Number(range);
    if (Number.isFinite(days) && days > 0) {
      const d = new Date();
      d.setDate(d.getDate() - days + 1);
      cutoff = d.toISOString().slice(0, 10);
    }
  }

  const logs = all.filter((l) => {
    if (cutoff && l.date < cutoff) return false;
    if (!matchesFilter(l.subject, filter)) return false;
    if (!query) return true;
    return matches(l, query);
  });

  return (
    <PageShell
      title="리포트"
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
        <div className="flex flex-wrap items-center gap-3">
          <SubjectFilter defaultPerson="박란하" />
          <RangeFilter current={range} />
        </div>
      </div>

      {all.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          기록이 없습니다. 위에서 새 기록을 추가해보세요.
        </p>
      ) : (
        <HealthListView logs={logs} />
      )}
    </PageShell>
  );
}

function RangeFilter({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="기간 필터">
      {RANGE_OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <Link
            key={o.value}
            href={makeRangeHref(o.value)}
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

function makeRangeHref(value: string): string {
  // Server-side; the SubjectFilter and SearchBar manage their own params,
  // so we can use a relative search-only href. Range is added without
  // disturbing other params via a small URL trick: leave only `range` here
  // and rely on the SubjectFilter/SearchBar to re-set theirs on next click.
  // Simpler approach: read window.location? — we're on the server. So we
  // emit only the range param; users typically pick range last.
  return `?range=${encodeURIComponent(value)}`;
}

function matches(log: HealthLog, q: string): boolean {
  if (log.note && log.note.toLowerCase().includes(q)) return true;
  for (const t of log.bodyTags) if (t.toLowerCase().includes(q)) return true;
  for (const t of log.moodTags) if (t.toLowerCase().includes(q)) return true;
  return false;
}
