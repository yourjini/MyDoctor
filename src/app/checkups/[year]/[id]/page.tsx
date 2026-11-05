import Link from "next/link";

import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { KindChip } from "@/components/KindChip";
import { getCheckup } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { CheckupEditView } from "./CheckupEditView";

// 파일 N개 저장 시 Blob 다운로드 + GitHub 커밋 여러 번이 순차로 돌아
// 10s 기본 limit 쉽게 넘어감. 60s 로 상향.
export const maxDuration = 60;

export const dynamic = "force-dynamic";

export default async function CheckupDetail({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year, id } = await params;
  const c = await getCheckup(year, id);
  if (!c) notFound();

  return (
    <PageShell
      title="건강검진 상세"
      action={
        <Link
          href="/checkups"
          className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:underline"
        >
          ← 목록
        </Link>
      }
    >
      <div className="mb-3">
        <KindChip kind="checkup" />
      </div>

      <CheckupEditView checkup={c} year={year} />

      <div className="mt-6 text-xs text-muted-foreground">
        기록 생성: {formatDate(c.createdAt, true)}
        {c.updatedAt !== c.createdAt && (
          <> · 마지막 수정: {formatDate(c.updatedAt, true)}</>
        )}
      </div>
    </PageShell>
  );
}
