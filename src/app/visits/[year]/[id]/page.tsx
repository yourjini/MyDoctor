import Link from "next/link";

import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { KindChip } from "@/components/KindChip";
import { getVisit } from "@/lib/store";
import { deleteVisitAction } from "../../actions";
import { formatDate } from "@/lib/utils";
import { VisitEditView } from "./VisitEditView";

// 파일 N개 저장 시 Blob 다운로드 + GitHub 커밋 여러 번이 순차로 돌아
// 10s 기본 limit 쉽게 넘어감. 60s 로 상향.
export const maxDuration = 60;

export const dynamic = "force-dynamic";

export default async function VisitDetail({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const visit = await getVisit(year, id);
  if (!visit) notFound();

  return (
    <PageShell
      title="방문 상세"
      action={
        <Link
          href="/visits"
          className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <div className="mb-3">
        <KindChip kind="visit" />
      </div>

      <VisitEditView visit={visit} year={year} />

      <div className="mt-6 flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div>
          기록 생성: {formatDate(visit.createdAt, true)}
          {visit.updatedAt !== visit.createdAt && (
            <> · 마지막 수정: {formatDate(visit.updatedAt, true)}</>
          )}
        </div>
        <form action={deleteVisitAction}>
          <input type="hidden" name="id" value={visit.id} />
          <input type="hidden" name="year" value={year} />
          <button type="submit" className="inline-flex min-h-11 items-center rounded px-2 text-destructive hover:underline">
            삭제
          </button>
        </form>
      </div>
    </PageShell>
  );
}
