"use client";

import { useState } from "react";
import { DiaryForm } from "../../DiaryForm";
import {
  deleteDiaryEntryAction,
  updateDiaryEntryAction,
} from "../../actions";
import type { DiaryEntry } from "@/lib/types";

export function DiaryEditView({
  entry,
  year,
}: {
  entry: DiaryEntry;
  year: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <DiaryForm
        action={updateDiaryEntryAction}
        initialDate={entry.date}
        defaults={{
          date: entry.date,
          title: entry.title,
          body: entry.body,
          mood: entry.mood,
        }}
        hiddenInputs={{ id: entry.id, year }}
        submitLabel="수정 저장"
      />
    );
  }

  return (
    <article className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <header className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{entry.date}</span>
        {entry.mood != null && (
          <span
            className={
              entry.mood > 0
                ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-800"
                : entry.mood < 0
                  ? "rounded bg-blue-100 px-1.5 py-0.5 text-blue-800"
                  : "rounded bg-muted px-1.5 py-0.5"
            }
          >
            기분 {entry.mood > 0 ? `+${entry.mood}` : entry.mood}
          </span>
        )}
      </header>

      {entry.title && (
        <h1 className="text-lg font-semibold">{entry.title}</h1>
      )}

      <div className="whitespace-pre-wrap text-sm leading-7">{entry.body}</div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          수정하기
        </button>
        <form action={deleteDiaryEntryAction}>
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="year" value={year} />
          <button
            type="submit"
            className="rounded-md border border-rose-200 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
            onClick={(e) => {
              if (!confirm("이 다이어리 항목을 삭제할까요?")) {
                e.preventDefault();
              }
            }}
          >
            삭제
          </button>
        </form>
      </div>
    </article>
  );
}
