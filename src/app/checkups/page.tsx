import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { HealthDataTabs } from "@/components/HealthDataTabs";
import { listCheckups } from "@/lib/store";
import { matchesFilter } from "@/lib/people";
import { currentSubject } from "@/lib/current-subject";
import { KIND_STYLES } from "@/lib/kinds";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckupsPage() {
  // 상단 전역 PersonSwitcher (쿠키) 를 그대로 따름. 아래쪽 중복 필터 제거.
  const filter = await currentSubject();
  const everything = await listCheckups();
  const all = everything.filter((c) => matchesFilter(c.subject, filter));

  const byYear = new Map<string, typeof all>();
  for (const c of all) {
    const y = c.date.slice(0, 4);
    const arr = byYear.get(y) ?? [];
    arr.push(c);
    byYear.set(y, arr);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <PageShell
      title="건강자료"
      action={
        <Link
          href="/checkups/new"
          className={cn(
            "inline-flex min-h-11 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            KIND_STYLES.checkup.solid,
          )}
        >
          + 새 검진
        </Link>
      }
    >
      <HealthDataTabs />

      {all.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {everything.length === 0
            ? "검진 기록이 없습니다. 위에서 새 검진 기록을 추가해보세요."
            : "선택된 대상자의 검진 기록이 없습니다."}
        </p>
      ) : (
        <div className="space-y-6">
          {years.map((y) => (
            <section key={y}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {y}
              </h2>
              <ul className="rounded-lg border bg-card divide-y">
                {byYear.get(y)!.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/checkups/${y}/${c.id}`}
                      className="flex items-start gap-3 p-4 hover:bg-accent/40"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {c.category && (
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                    c.category === "건강검진"
                                      ? "bg-indigo-500/10 text-indigo-700"
                                      : "bg-emerald-500/10 text-emerald-700",
                                  )}
                                >
                                  {c.category}
                                </span>
                              )}
                              <span className="font-medium truncate">
                                {c.title}
                              </span>
                            </div>
                            {c.hospitalName && (
                              <div className="text-xs text-muted-foreground">
                                {c.hospitalName}
                              </div>
                            )}
                            {c.symptoms && (
                              <div className="mt-2 line-clamp-2 text-xs text-amber-700">
                                주의: {c.symptoms}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 text-right text-xs text-muted-foreground">
                            {c.date}
                            {c.attachments.length > 0 && (
                              <div>첨부 {c.attachments.length}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
