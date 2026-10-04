import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getCaution } from "@/lib/store";
import { CautionEditView } from "./CautionEditView";

export const dynamic = "force-dynamic";

export default async function CautionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getCaution(id);
  if (!item) notFound();

  return (
    <PageShell
      title="주의 항목"
      action={
        <Link
          href="/cautions"
          className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <CautionEditView item={item} />
    </PageShell>
  );
}
