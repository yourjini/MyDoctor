"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type DiaryFormDefaults = {
  date?: string;
  title?: string;
  body?: string;
  mood?: number;
};

export function DiaryForm({
  action,
  defaults,
  initialDate,
  hiddenInputs,
  submitLabel = "저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: DiaryFormDefaults;
  initialDate: string;
  hiddenInputs?: Record<string, string>;
  submitLabel?: string;
}) {
  const [mood, setMood] = useState<number | undefined>(defaults?.mood);

  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      {hiddenInputs &&
        Object.entries(hiddenInputs).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input
        type="hidden"
        name="mood"
        value={mood === undefined ? "" : String(mood)}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">
          날짜 <span className="text-rose-600">*</span>
        </label>
        <input
          type="date"
          name="date"
          defaultValue={defaults?.date ?? initialDate}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">내 기분 (선택)</label>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setMood(undefined)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs",
              mood === undefined
                ? "bg-foreground text-background"
                : "bg-background hover:bg-accent",
            )}
          >
            —
          </button>
          {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((n) => {
            const active = mood === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setMood(n)}
                className={cn(
                  "h-8 min-w-[2rem] rounded-md border text-xs font-medium",
                  active
                    ? n < 0
                      ? "border-blue-600 bg-blue-600 text-white"
                      : n > 0
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "bg-foreground text-background"
                    : "bg-background hover:bg-accent",
                )}
              >
                {n > 0 ? `+${n}` : n}
              </button>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>← 힘듦</span>
          <span>평온</span>
          <span>좋음 →</span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">제목 (선택)</label>
        <input
          type="text"
          name="title"
          defaultValue={defaults?.title ?? ""}
          placeholder="짧은 제목"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          내용 <span className="text-rose-600">*</span>
        </label>
        <textarea
          name="body"
          required
          rows={10}
          defaultValue={defaults?.body ?? ""}
          placeholder="오늘 있었던 일, 마음에 걸리는 것, 란하의 상태 등 자유롭게…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-6"
        />
      </div>

      <div>
        <button
          type="submit"
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
