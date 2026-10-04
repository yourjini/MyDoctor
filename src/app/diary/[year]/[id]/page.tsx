import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DIARY_COOKIE, verifyDiaryToken } from "@/lib/auth";
import { getDiaryEntry } from "@/lib/store";
import { DiaryEditView } from "./DiaryEditView";

export const dynamic = "force-dynamic";

export default async function DiaryDetailPage({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const jar = await cookies();
  if (!(await verifyDiaryToken(jar.get(DIARY_COOKIE)?.value))) {
    notFound();
  }
  const { year, id } = await params;
  const entry = await getDiaryEntry(year, id);
  if (!entry) notFound();

  return (
    <PageShell
      title="다이어리"
      action={
        <Link
          href="/diary"
          className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <DiaryEditView entry={entry} year={year} />
    </PageShell>
  );
}
