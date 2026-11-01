import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getCondition, listExamsFor, listVisits } from "@/lib/store";
import { ConditionDetailView } from "./ConditionDetailView";
import {
  ImportFromVisits,
  type ImportCandidate,
} from "./ImportFromVisits";

export const dynamic = "force-dynamic";

export default async function ConditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const condition = await getCondition(id);
  if (!condition) notFound();

  const [exams, allVisits] = await Promise.all([
    listExamsFor(id),
    listVisits(),
  ]);

  // 이미 이 condition 의 exam 으로 가져온 visit 들은 제외.
  const importedVisitIds = new Set(
    exams.map((e) => e.sourceVisitId).filter((x): x is string => !!x),
  );

  // 매칭 가능 후보: 같은 대상자 + 아직 안 가져온 방문. 최신 순.
  const candidates: ImportCandidate[] = allVisits
    .filter((v) => v.subject === condition.subject)
    .filter((v) => !importedVisitIds.has(v.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map((v) => ({
      year: v.date.slice(0, 4),
      id: v.id,
      date: v.date,
      hospitalType: String(v.hospitalType || ""),
      hospitalName: v.hospitalName,
      diagnosis: v.diagnosis,
      detailsPreview: (v.details ?? "").slice(0, 140),
    }));

  return (
    <PageShell
      title="건강추적 상세"
      action={
        <Link
          href="/conditions"
          className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:underline"
        >
          ← 건강추적
        </Link>
      }
    >
      <ConditionDetailView condition={condition} exams={exams} />

      <section className="mt-6 rounded-lg border bg-card p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold">
          방문이력에서 업데이트
        </h3>
        <ImportFromVisits conditionId={condition.id} candidates={candidates} />
      </section>
    </PageShell>
  );
}
