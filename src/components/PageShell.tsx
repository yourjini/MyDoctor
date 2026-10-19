// Nav 는 root layout 에서 렌더되므로 여기서는 중복 호출하지 않는다.
// (PageShell 이 Nav 를 포함하면 라우트 전환마다 Nav 가 unmount/remount 되어
// PersonSwitcher 가 깜빡거렸음.)

export function PageShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="container-narrow py-4 pb-24 sm:py-6 sm:pb-6">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {action}
      </div>
      {children}
    </main>
  );
}
