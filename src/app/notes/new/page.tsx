import { PageShell } from "@/components/PageShell";
import { NoteForm } from "../NoteForm";
import { createClinicNoteAction } from "../actions";

export default async function NewClinicNotePage() {
  return (
    <PageShell title="새 선생님 메모">
      <NoteForm action={createClinicNoteAction} />
    </PageShell>
  );
}
