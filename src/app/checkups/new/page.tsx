import { PageShell } from "@/components/PageShell";

import { CheckupForm } from "./CheckupForm";

// 파일 N개 저장 시 Blob 다운로드 + GitHub 커밋 여러 번이 순차로 돌아
// 10s 기본 limit 쉽게 넘어감. 60s 로 상향.
export const maxDuration = 60;

export default async function NewCheckupPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  return (
    <PageShell title="새 건강검진">
      <CheckupForm initialDate={initialDate} />
    </PageShell>
  );
}
