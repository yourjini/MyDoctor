import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { KindChip } from "@/components/KindChip";
import { getHealthLog } from "@/lib/store";
import { deleteHealthLogAction } from "../../actions";
import { formatDate } from "@/lib/utils";
import { HealthEditView } from "./HealthEditView";

export const dynamic = "force-dynamic";

export default async function HealthDetail({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const log = await getHealthLog(year, id);
  if (!log) notFound();

  return (
    <PageShell
      title="건강일지 상세"
      action={
        <Link
          href="/health"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <div className="mb-3">
        <KindChip kind="health" />
      </div>

      <HealthEditView log={log} year={year} />

      <div className="mt-6 flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <div>
          기록 생성: {formatDate(log.createdAt, true)}
          {log.updatedAt !== log.createdAt && (
            <> · 마지막 수정: {formatDate(log.updatedAt, true)}</>
          )}
        </div>
        <form action={deleteHealthLogAction}>
          <input type="hidden" name="id" value={log.id} />
          <input type="hidden" name="year" value={year} />
          <button type="submit" className="rounded text-destructive hover:underline">
            삭제
          </button>
        </form>
      </div>
    </PageShell>
  );
}
