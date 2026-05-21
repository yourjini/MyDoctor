import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getCondition, listExamsFor } from "@/lib/store";
import { ConditionDetailView } from "./ConditionDetailView";

export const dynamic = "force-dynamic";

export default async function ConditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const condition = await getCondition(id);
  if (!condition) notFound();

  const exams = await listExamsFor(id);

  return (
    <PageShell
      title="질환 상세"
      action={
        <Link
          href="/conditions"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 건강일지
        </Link>
      }
    >
      <ConditionDetailView condition={condition} exams={exams} />
    </PageShell>
  );
}
