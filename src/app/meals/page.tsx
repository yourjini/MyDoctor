import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import { asPerson, matchesFilter } from "@/lib/people";
import { listMeals } from "@/lib/store";
import type { Meal, MealSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const SLOT_ORDER: Record<MealSlot, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const filter = asPerson(sp.subject);

  const all = await listMeals();
  const meals = all.filter((m) => matchesFilter(m.subject, filter));

  // Group by date
  const byDate = new Map<string, Meal[]>();
  for (const m of meals) {
    const arr = byDate.get(m.date) ?? [];
    arr.push(m);
    byDate.set(m.date, arr);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <PageShell
      title="식사 기록"
      action={
        <Link
          href="/meals/new"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + 식사 추가
        </Link>
      }
    >
      <div className="mb-3 space-y-2">
        <SubjectFilter />
      </div>

      {meals.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          {all.length === 0
            ? "식사 기록이 없습니다. 우상단 \"+ 식사 추가\"를 눌러보세요."
            : "조건에 맞는 기록이 없습니다."}
        </p>
      ) : (
        <div className="space-y-5">
          {dates.map((d) => {
            const dayMeals = byDate.get(d)!.slice().sort((a, b) => {
              if (a.slot !== b.slot) return SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot];
              return (a.time ?? "").localeCompare(b.time ?? "");
            });
            return (
              <section key={d}>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  {d}
                </h2>
                <ul className="rounded-lg border bg-card divide-y">
                  {dayMeals.map((m) => {
                    const ym = m.date.slice(0, 7).replace("-", "/");
                    const [year, month] = ym.split("/");
                    return (
                      <li key={m.id}>
                        <Link
                          href={`/meals/${year}/${month}/${m.id}`}
                          className="flex items-start gap-3 p-4 hover:bg-accent/40"
                        >
                          <SubjectBadge
                            subject={m.subject}
                            size="md"
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-900">
                                {SLOT_LABEL[m.slot]}
                              </span>
                              {m.time && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                                  {m.time}
                                </span>
                              )}
                              {m.rating && (
                                <span className="text-amber-500">
                                  {"★".repeat(m.rating)}
                                </span>
                              )}
                              {m.tags.map((t) => (
                                <span
                                  key={`t-${t}`}
                                  className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 line-clamp-2 text-sm">
                              {m.menu}
                            </div>
                            {m.note && (
                              <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {m.note}
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
