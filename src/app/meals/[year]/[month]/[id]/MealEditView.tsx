"use client";

import { useState } from "react";
import { MealForm } from "../../../MealForm";
import { deleteMealAction, updateMealAction } from "../../../actions";
import type { Meal, MealSlot } from "@/lib/types";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export function MealEditView({
  meal,
  year,
  month,
}: {
  meal: Meal;
  year: string;
  month: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <MealForm
        action={updateMealAction}
        initialDate={meal.date}
        initialSlot={meal.slot}
        initialSubject={meal.subject}
        defaults={{
          subject: meal.subject,
          date: meal.date,
          time: meal.time,
          slot: meal.slot,
          menu: meal.menu,
          calories: meal.calories,
          macros: meal.macros,
          tags: meal.tags,
          rating: meal.rating,
          note: meal.note,
          fromLibraryId: meal.fromLibraryId,
        }}
        hiddenInputs={{ id: meal.id, year, month }}
        submitLabel="수정 저장"
      />
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs text-muted-foreground">
            {meal.date} {meal.time && `· ${meal.time}`} · {meal.subject}
          </div>
          <h1 className="text-lg font-semibold">
            <span className="mr-2 rounded bg-emerald-100 px-2 py-0.5 text-sm text-emerald-900">
              {SLOT_LABEL[meal.slot]}
            </span>
            {meal.menu}
          </h1>
        </div>
        {meal.rating && (
          <div className="text-amber-500">{"★".repeat(meal.rating)}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {meal.calories != null && (
          <span className="rounded bg-muted px-1.5 py-0.5">
            {meal.calories}kcal
          </span>
        )}
        {meal.macros && (
          <span className="rounded bg-slate-50 px-1.5 py-0.5 text-slate-600">
            탄수 {meal.macros.carbG ?? "-"}g · 단백질{" "}
            {meal.macros.proteinG ?? "-"}g · 지방 {meal.macros.fatG ?? "-"}g
          </span>
        )}
        {meal.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800"
          >
            {t}
          </span>
        ))}
      </div>

      {meal.note && (
        <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
          {meal.note}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          수정하기
        </button>
        <form action={deleteMealAction}>
          <input type="hidden" name="id" value={meal.id} />
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month} />
          <button
            type="submit"
            className="rounded-md border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
            onClick={(e) => {
              if (!confirm("이 식사 기록을 삭제할까요?")) {
                e.preventDefault();
              }
            }}
          >
            삭제
          </button>
        </form>
      </div>
    </div>
  );
}
