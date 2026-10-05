import { PageShell } from "@/components/PageShell";
import { VisitForm } from "./VisitForm";

// 파일 N개 저장 시 Blob 다운로드 + GitHub 커밋 여러 번이 순차로 돌아
// 10s 기본 limit 쉽게 넘어감. 60s 로 상향.
export const maxDuration = 60;

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: queryDate } = await searchParams;
  const initialDate = isValidDate(queryDate) ? queryDate : undefined;
  return (
    <PageShell title="새 방문 기록">
      <VisitForm initialDate={initialDate} />
    </PageShell>
  );
}

function isValidDate(s?: string): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
