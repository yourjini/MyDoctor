import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getClinicNote } from "@/lib/store";
import { NoteEditView } from "./NoteEditView";

export const dynamic = "force-dynamic";

export default async function ClinicNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getClinicNote(id);
  if (!note) notFound();

  return (
    <PageShell
      title="선생님 메모"
      action={
        <Link
          href="/notes"
          className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <NoteEditView note={note} />
    </PageShell>
  );
}
