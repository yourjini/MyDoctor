import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import { asPerson, matchesFilter } from "@/lib/people";
import { listHealthLogs, listMeals, getProfile } from "@/lib/store";
import { calorieTargetFor, sumCalories } from "@/lib/calorie";
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

  // For 박란하 specifically: compute calorie target based on latest weight + profile
  const today = new Date().toISOString().slice(0, 10);
  let targetSummary: {
    target: number;
    bmr: number;
    tdee: number;
    weightUsed: number;
    weightDate: string;
  } | null = null;
  if (filter === "박란하") {
    const [profile, healthLogs] = await Promise.all([
      getProfile("박란하"),
      listHealthLogs(),
    ]);
    const latestWithWeight = healthLogs
      .filter((l) => (l.subject ?? "전체") === "박란하" && l.weight != null)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (profile && latestWithWeight?.weight != null) {
      const calc = calorieTargetFor(profile, latestWithWeight.weight);
      if (calc) {
        targetSummary = {
          target: calc.target,
          bmr: calc.bmr,
          tdee: calc.tdee,
          weightUsed: latestWithWeight.weight,
          weightDate: latestWithWeight.date,
        };
      }
    }
  }

  const todayMeals = byDate.get(today) ?? [];
  const todaySum = sumCalories(todayMeals);

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

      {filter === "박란하" && (
        <TargetCard
          target={targetSummary}
          today={todaySum}
          missingProfile={!targetSummary}
        />
      )}

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
            const sum = sumCalories(dayMeals);
            return (
              <section key={d}>
                <h2 className="mb-2 flex items-baseline justify-between text-sm font-medium text-muted-foreground">
                  <span>{d}</span>
                  <span className="text-xs">
                    {sum.counted > 0 && (
                      <>
                        합계 {sum.kcal}kcal
                        {sum.missing > 0 && (
                          <span className="ml-1">
                            ({sum.missing}개 칼로리 없음)
                          </span>
                        )}
                      </>
                    )}
                  </span>
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
                              {m.calories != null && (
                                <span className="rounded bg-muted px-1.5 py-0.5">
                                  {m.calories}kcal
                                </span>
                              )}
                              {m.macros && (
                                <span className="rounded bg-slate-50 px-1.5 py-0.5 text-slate-600">
                                  C{m.macros.carbG ?? "-"} P
                                  {m.macros.proteinG ?? "-"} F
                                  {m.macros.fatG ?? "-"}
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

function TargetCard({
  target,
  today,
  missingProfile,
}: {
  target: {
    target: number;
    bmr: number;
    tdee: number;
    weightUsed: number;
    weightDate: string;
  } | null;
  today: { kcal: number; counted: number; missing: number };
  missingProfile: boolean;
}) {
  if (!target) {
    return (
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <div className="font-medium text-amber-900">
          {missingProfile
            ? "오늘 목표 칼로리 계산 불가"
            : "프로필 정보 부족"}
        </div>
        <p className="mt-1 text-xs text-amber-800">
          <Link href="/profile" className="underline">
            프로필
          </Link>
          에서 생년월일·키·활동량을 입력하고, 건강일지에 최근 체중을 한 번
          기록하면 일일 칼로리 목표가 표시됩니다.
        </p>
      </div>
    );
  }
  const pct = Math.min(100, Math.round((today.kcal / target.target) * 100));
  const over = today.kcal > target.target;
  return (
    <div className="mb-4 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-sm font-medium">오늘 목표 (란하)</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            체중 {target.weightUsed}kg ({target.weightDate} 기준) · 유지{" "}
            {target.tdee}kcal · 감량 목표 ≈ {target.target}kcal
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-2xl font-semibold ${
              over ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {today.kcal}
            <span className="ml-1 text-sm text-muted-foreground">
              / {target.target}kcal
            </span>
          </div>
          {today.missing > 0 && (
            <div className="text-[11px] text-muted-foreground">
              ({today.missing}끼 칼로리 미입력)
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${
            over ? "bg-rose-500" : "bg-emerald-500"
          } transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
