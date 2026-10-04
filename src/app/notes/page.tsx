import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { SubjectFilter } from "@/components/SubjectFilter";
import { asPerson, matchesFilter } from "@/lib/people";
import { listClinicNotes } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ClinicNote } from "@/lib/types";
import { toggleClinicNoteAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; show?: string }>;
}) {
  const sp = await searchParams;
  const filter = asPerson(sp.subject);
  const showDone = sp.show === "done";

  const all = await listClinicNotes();
  const notes = all.filter((n) => matchesFilter(n.subject, filter));
  const pending = notes.filter((n) => n.status === "pending");
  const done = notes.filter((n) => n.status === "done");

  return (
    <PageShell
      title="선생님 메모"
      action={
        <Link
          href="/notes/new"
          className="inline-flex min-h-11 items-center rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
        >
          + 새 메모
        </Link>
      }
    >
      <p className="mb-3 text-sm text-muted-foreground">
        다음 진료 때 의사 선생님께 전달하거나 여쭐 사항을 모아둡니다.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SubjectFilter />
        <ShowDoneToggle showDone={showDone} doneCount={done.length} />
      </div>

      {all.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          아직 메모가 없습니다. 위의 + 새 메모로 추가해보세요.
        </p>
      ) : notes.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          이 대상자에게 해당하는 메모가 없습니다.
        </p>
      ) : (
        <div className="space-y-5">
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              🕒 대기 중 · {pending.length}건
            </h2>
            {pending.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-card/40 p-4 text-center text-xs text-muted-foreground">
                대기 중인 메모가 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {pending.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 && showDone && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                ✅ 전달함 · {done.length}건
              </h2>
              <ul className="space-y-2">
                {done.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

function ShowDoneToggle({
  showDone,
  doneCount,
}: {
  showDone: boolean;
  doneCount: number;
}) {
  if (doneCount === 0) return null;
  const href = showDone ? "/notes" : "/notes?show=done";
  return (
    <Link
      href={href}
      className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
    >
      {showDone ? "✅ 전달함 숨기기" : `✅ 전달함 ${doneCount}건 보기`}
    </Link>
  );
}

function NoteCard({ note }: { note: ClinicNote }) {
  const done = note.status === "done";
  return (
    <li
      className={cn(
        "flex gap-2 rounded-lg border bg-card p-3 transition-opacity",
        done && "opacity-60",
      )}
    >
      <form action={toggleClinicNoteAction} className="shrink-0">
        <input type="hidden" name="id" value={note.id} />
        <button
          type="submit"
          aria-label={done ? "대기로 되돌리기" : "전달함으로 표시"}
          className={cn(
            "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border transition-colors",
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/40 hover:border-foreground hover:bg-accent",
          )}
        >
          {done && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </form>

      <Link href={`/notes/${note.id}`} className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <SubjectBadge subject={note.subject} size="sm" />
          {note.hospitalType && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {note.hospitalType}
            </span>
          )}
          {note.title && (
            <span
              className={cn(
                "text-sm font-medium",
                done && "line-through",
              )}
            >
              {note.title}
            </span>
          )}
        </div>
        <p
          className={cn(
            "whitespace-pre-wrap text-sm text-foreground/90 line-clamp-3",
            done && "text-muted-foreground",
          )}
        >
          {note.body}
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {note.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-pink-50 px-1.5 py-0.5 text-[10px] text-pink-700"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </Link>
    </li>
  );
}
