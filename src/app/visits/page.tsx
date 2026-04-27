import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { listVisits } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function VisitsPage() {
  const visits = await listVisits();

  // group by year
  const byYear = new Map<string, typeof visits>();
  for (const v of visits) {
    const y = v.date.slice(0, 4);
    const arr = byYear.get(y) ?? [];
    arr.push(v);
    byYear.set(y, arr);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <PageShell
      title="방문이력"
      action={
        <Link
          href="/visits/new"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          + 새 방문
        </Link>
      }
    >
      {visits.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          기록된 방문이 없습니다. 위에서 새 방문을 추가해보세요.
        </p>
      ) : (
        <div className="space-y-6">
          {years.map((y) => (
            <section key={y}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {y}
              </h2>
              <ul className="rounded-lg border bg-card divide-y">
                {byYear.get(y)!.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/visits/${y}/${v.id}`}
                      className="flex items-start justify-between p-4 hover:bg-accent/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {v.hospitalType}
                          </span>
                          <span className="font-medium truncate">
                            {v.hospitalName}
                          </span>
                          {v.insuranceClaimed && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-900">
                              실비청구
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground truncate">
                          {v.diagnosis}
                        </div>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <div className="text-sm">{v.date}</div>
                        {v.attachments.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            첨부 {v.attachments.length}
                          </div>
                        )}
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
