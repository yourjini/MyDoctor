// Nav 는 root layout 에서 이미 persistent 하게 렌더되므로 loading UI 에
// 다시 포함하면 Nav + PersonSwitcher 가 통째로 중복 노출된다 (라우트 전환
// 중 Suspense fallback 으로 이 파일이 잠깐 보일 때 상단바 2개 겹치고
// 사람 레이블이 깜빡거리는 원인이었음).
export default function Loading() {
  return (
    <main className="container-narrow py-4 sm:py-6">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-12 animate-pulse rounded-lg border bg-card" />
        <div className="h-24 animate-pulse rounded-lg border bg-card" />
        <div className="h-24 animate-pulse rounded-lg border bg-card" />
        <div className="h-24 animate-pulse rounded-lg border bg-card" />
      </div>
    </main>
  );
}
