import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DIARY_COOKIE, verifyDiaryToken } from "@/lib/auth";
import { DiaryForm } from "../DiaryForm";
import { createDiaryEntryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDiaryPage() {
  const jar = await cookies();
  if (!(await verifyDiaryToken(jar.get(DIARY_COOKIE)?.value))) {
    // Locked: don't expose the form. Send the user back to /diary which
    // will render the unlock screen.
    notFound();
  }
  const today = new Date().toISOString().slice(0, 10);
  return (
    <PageShell title="새 다이어리">
      <DiaryForm action={createDiaryEntryAction} initialDate={today} />
    </PageShell>
  );
}
