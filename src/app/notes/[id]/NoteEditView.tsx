"use client";

import { useState } from "react";
import { SubjectBadge } from "@/components/SubjectBadge";
import { NoteForm } from "../NoteForm";
import {
  deleteClinicNoteAction,
  toggleClinicNoteAction,
  updateClinicNoteAction,
} from "../actions";
import { cn } from "@/lib/utils";
import type { ClinicNote } from "@/lib/types";

export function NoteEditView({ note }: { note: ClinicNote }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <NoteForm
        action={updateClinicNoteAction}
        defaults={{
          subject: note.subject,
          title: note.title,
          body: note.body,
          hospitalType: note.hospitalType,
          tags: note.tags,
          status: note.status,
        }}
        hiddenInputs={{ id: note.id }}
        submitLabel="수정 저장"
      />
    );
  }

  const done = note.status === "done";

  return (
    <article className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SubjectBadge subject={note.subject} size="md" />
          {note.title && (
            <h1
              className={cn(
                "text-xl font-semibold",
                done && "text-muted-foreground line-through",
              )}
            >
              {note.title}
            </h1>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              done
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800",
            )}
          >
            {done ? "✅ 전달함" : "🕒 대기"}
          </span>
        </div>
        {note.hospitalType && (
          <div className="text-xs text-muted-foreground">
            병원 · {note.hospitalType}
          </div>
        )}
        {done && note.doneAt && (
          <div className="text-[11px] text-muted-foreground">
            전달일 · {note.doneAt.slice(0, 10)}
          </div>
        )}
      </header>

      <section>
        <h2 className="mb-1 text-xs font-medium text-muted-foreground">
          내용
        </h2>
        <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm leading-6">
          {note.body}
        </p>
      </section>

      {note.tags && note.tags.length > 0 && (
        <section>
          <h2 className="mb-1 text-xs font-medium text-muted-foreground">
            태그
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-pink-50 px-2 py-0.5 text-xs text-pink-700"
              >
                #{t}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <form action={toggleClinicNoteAction}>
          <input type="hidden" name="id" value={note.id} />
          <button
            type="submit"
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium",
              done
                ? "border bg-background hover:bg-accent"
                : "bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            {done ? "🕒 대기로 되돌리기" : "✅ 전달함으로 표시"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          수정하기
        </button>
        <form action={deleteClinicNoteAction}>
          <input type="hidden" name="id" value={note.id} />
          <button
            type="submit"
            className="rounded-md border border-rose-200 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
            onClick={(e) => {
              if (!confirm("이 메모를 삭제할까요?")) {
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
