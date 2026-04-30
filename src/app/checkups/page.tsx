import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import { listCheckups } from "@/lib/store";
import { asPerson, matchesFilter } from "@/lib/people";

export const dynamic = "force-dynamic";

export default async function CheckupsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const filter = asPerson(sp.subject);
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
      title="건강검진"
      action={
        <Link
          href="/checkups/new"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          + 새 검진
        </Link>
      }
    >
      <div className="mb-4">
        <SubjectFilter />
      </div>

      {all.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {everything.length === 0
            ? "검진 기록이 없습니다. PDF나 이미지를 업로드하면 자동 요약이 됩니다."
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
                      <SubjectBadge subject={c.subject} size="md" className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{c.title}</div>
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
