"use client";

import { useMemo, useState } from "react";
import { TagPicker } from "@/components/TagPicker";
import { PEOPLE } from "@/lib/people";
import {
  MEAL_TAGS,
  libraryBySlot,
  suggestMeals,
  type MealLibraryItem,
} from "@/lib/meal-library";
import {
  matchFoods,
  sumMatch,
  type FoodMatch,
} from "@/lib/food-db";
import type { Meal, MealSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export type MealFormDefaults = Partial<
  Pick<
    Meal,
    | "subject"
    | "date"
    | "time"
    | "slot"
    | "menu"
    | "calories"
    | "macros"
    | "tags"
    | "note"
    | "rating"
    | "fromLibraryId"
  >
>;

export function MealForm({
  action,
  defaults,
  initialDate,
  initialSlot,
  initialSubject,
  hiddenInputs,
  submitLabel = "저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: MealFormDefaults;
  initialDate: string;
  initialSlot: MealSlot;
  initialSubject: string;
  hiddenInputs?: Record<string, string>;
  submitLabel?: string;
}) {
  const [slot, setSlot] = useState<MealSlot>(defaults?.slot ?? initialSlot);
  const [menu, setMenu] = useState<string>(defaults?.menu ?? "");
  const [calories, setCalories] = useState<string>(
    defaults?.calories != null ? String(defaults.calories) : "",
  );
  const [carbG, setCarbG] = useState<string>(
    defaults?.macros?.carbG != null ? String(defaults.macros.carbG) : "",
  );
  const [proteinG, setProteinG] = useState<string>(
    defaults?.macros?.proteinG != null
      ? String(defaults.macros.proteinG)
      : "",
  );
  const [fatG, setFatG] = useState<string>(
    defaults?.macros?.fatG != null ? String(defaults.macros.fatG) : "",
  );
  const [tags, setTags] = useState<string[]>(defaults?.tags ?? []);
  const [fromLibraryId, setFromLibraryId] = useState<string>(
    defaults?.fromLibraryId ?? "",
  );
  const [suggestions, setSuggestions] = useState<MealLibraryItem[]>([]);

  // 메뉴 텍스트 → 음식 매칭. 사용자가 ±로 인분 조정 가능.
  const baseMatches = useMemo<FoodMatch[]>(() => matchFoods(menu), [menu]);
  const [matchOverrides, setMatchOverrides] = useState<Record<string, number>>(
    {},
  );
  const matches: FoodMatch[] = useMemo(
    () =>
      baseMatches.map((m) => {
        const key = m.entry.label;
        const c = matchOverrides[key];
        return { ...m, count: c ?? m.count };
      }),
    [baseMatches, matchOverrides],
  );
  const matchTotal = useMemo(() => sumMatch(matches), [matches]);

  function bumpMatch(label: string, delta: number) {
    setMatchOverrides((prev) => {
      const cur = prev[label] ?? 1;
      const next = Math.max(0, cur + delta);
      return { ...prev, [label]: next };
    });
  }

  function applyMatchEstimate() {
    setCalories(String(matchTotal.calories));
    setCarbG(String(matchTotal.carbG));
    setProteinG(String(matchTotal.proteinG));
    setFatG(String(matchTotal.fatG));
  }

  function applyLibrary(item: MealLibraryItem) {
    setMenu(item.name + (item.description ? ` — ${item.description}` : ""));
    setCalories(String(item.calories));
    setCarbG(String(item.carbG));
    setProteinG(String(item.proteinG));
    setFatG(String(item.fatG));
    setTags(Array.from(new Set(item.tags)));
    setFromLibraryId(item.id);
    setSuggestions([]);
  }

  const slotLibrary = useMemo(() => libraryBySlot(slot), [slot]);

  return (
    <form
      action={action}
      className="space-y-5 rounded-lg border bg-card p-4 sm:p-5"
    >
      {hiddenInputs &&
        Object.entries(hiddenInputs).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input type="hidden" name="fromLibraryId" value={fromLibraryId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="날짜" required>
          <input
            type="date"
            name="date"
            defaultValue={defaults?.date ?? initialDate}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="시각">
          <input
            type="time"
            name="time"
            defaultValue={defaults?.time ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="대상자" required>
          <select
            name="subject"
            defaultValue={defaults?.subject ?? initialSubject}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {PEOPLE.filter((p) => p !== "박범진").map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="끼니">
          <div className="flex flex-wrap gap-1.5">
            {(["breakfast", "lunch", "dinner", "snack"] as MealSlot[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    slot === s
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-background hover:bg-accent",
                  )}
                >
                  {SLOT_LABEL[s]}
                </button>
              ),
            )}
            <input type="hidden" name="slot" value={slot} />
          </div>
        </Field>
      </div>

      {/* 메뉴 제안 */}
      <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-emerald-900">
            메뉴 추천
          </span>
          <button
            type="button"
            onClick={() => setSuggestions(suggestMeals(slot, 3))}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
          >
            🍽 {SLOT_LABEL[slot]} 메뉴 제안받기
          </button>
          <span className="text-xs text-emerald-800">
            저탄저지·고단백 위주
          </span>
        </div>
        {suggestions.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applyLibrary(s)}
                className="rounded-md border bg-white p-2 text-left hover:border-emerald-400 hover:bg-emerald-50"
              >
                <div className="text-sm font-medium">{s.name}</div>
                {s.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.description}
                  </div>
                )}
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {s.calories}kcal · C{s.carbG} P{s.proteinG} F{s.fatG}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Field label="메뉴" required>
        <textarea
          name="menu"
          required
          rows={2}
          value={menu}
          onChange={(e) => {
            setMenu(e.target.value);
            setMatchOverrides({});
          }}
          placeholder="예: 닭가슴살 100g + 현미밥 1/2공기 + 샐러드"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      {matches.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50/40 p-3">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-amber-900">
                메뉴에서 인식된 음식
              </span>
              <span className="ml-2 text-[11px] text-amber-800">
                ±로 인분 조정 가능 · 수량 자동 인식 안 됨
              </span>
            </div>
            <button
              type="button"
              onClick={applyMatchEstimate}
              className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
            >
              추정값 칼로리에 적용 (≈{matchTotal.calories}kcal)
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matches.map((m) => (
              <div
                key={m.entry.label}
                className="flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => bumpMatch(m.entry.label, -1)}
                  className="rounded-full px-1 text-amber-700 hover:bg-amber-100"
                  aria-label="감소"
                >
                  −
                </button>
                <span className="font-medium">
                  {m.entry.label}
                </span>
                <span className="text-muted-foreground">
                  ×{m.count}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({m.entry.portion}, {m.entry.calories}kcal)
                </span>
                <button
                  type="button"
                  onClick={() => bumpMatch(m.entry.label, +1)}
                  className="rounded-full px-1 text-amber-700 hover:bg-amber-100"
                  aria-label="증가"
                >
                  +
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            합계 ≈ {matchTotal.calories}kcal · C{matchTotal.carbG} P
            {matchTotal.proteinG} F{matchTotal.fatG}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="칼로리 (kcal)">
          <input
            type="number"
            name="calories"
            min={0}
            step={10}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="탄수 (g)">
          <input
            type="number"
            name="carbG"
            min={0}
            step={1}
            value={carbG}
            onChange={(e) => setCarbG(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="단백질 (g)">
          <input
            type="number"
            name="proteinG"
            min={0}
            step={1}
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="지방 (g)">
          <input
            type="number"
            name="fatG"
            min={0}
            step={1}
            value={fatG}
            onChange={(e) => setFatG(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="태그">
        <TagPicker
          key={tags.join(",")}
          name="tags"
          groups={MEAL_TAGS}
          defaultValue={tags}
          selectedClass="bg-emerald-600 text-white border-emerald-600"
        />
      </Field>

      <Field label="별점">
        <RatingPicker defaultValue={defaults?.rating} />
      </Field>

      <Field label="메모">
        <textarea
          name="note"
          rows={2}
          defaultValue={defaults?.note ?? ""}
          placeholder="포만감, 컨디션 변화 등"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {submitLabel}
        </button>
        <details className="ml-auto">
          <summary className="cursor-pointer rounded-md border px-3 py-2 text-xs hover:bg-accent">
            라이브러리 전체 보기
          </summary>
          <div className="mt-2 grid max-h-96 gap-1.5 overflow-y-auto rounded-md border bg-background p-2 sm:grid-cols-2">
            {slotLibrary.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">
                이 끼니에는 등록된 라이브러리가 없습니다.
              </p>
            ) : (
              slotLibrary.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => applyLibrary(m)}
                  className="rounded-md border bg-white p-2 text-left text-xs hover:border-emerald-400 hover:bg-emerald-50"
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="mt-0.5 text-muted-foreground">
                    {m.calories}kcal · C{m.carbG} P{m.proteinG} F{m.fatG}
                  </div>
                </button>
              ))
            )}
          </div>
        </details>
      </div>

    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function RatingPicker({ defaultValue }: { defaultValue?: number }) {
  const [value, setValue] = useState<number | undefined>(defaultValue);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="hidden"
        name="rating"
        value={value === undefined ? "" : String(value)}
      />
      <button
        type="button"
        onClick={() => setValue(undefined)}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs",
          value === undefined
            ? "bg-foreground text-background"
            : "bg-background hover:bg-accent",
        )}
      >
        —
      </button>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setValue(n)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs",
            value === n
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-background hover:bg-accent",
          )}
        >
          {"★".repeat(n)}
        </button>
      ))}
    </div>
  );
}
