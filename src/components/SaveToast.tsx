"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// 서버 액션이 redirect("/.../?saved=1") 또는 ?saved=메시지 를 붙여서
// 돌아오면, 이 컴포넌트가 그걸 감지해 하단 토스트를 띄우고 2초 후 사라짐.
// URL 에서 saved 파라미터는 자동으로 제거해 뒤로가기/새로고침 때 재노출 방지.

const MESSAGES: Record<string, string> = {
  "1": "저장되었습니다",
  saved: "저장되었습니다",
  deleted: "삭제되었습니다",
  completed: "방문완료로 처리했습니다",
  missed: "비방문으로 처리했습니다",
  reopened: "예약 상태로 되돌렸습니다",
  converted: "예약으로 전환했습니다",
  imported: "방문이력에서 가져왔습니다",
};

function SaveToastInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const saved = sp.get("saved");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("저장되었습니다");

  useEffect(() => {
    if (!saved) return;
    setMsg(MESSAGES[saved] ?? "저장되었습니다");
    setShow(true);

    // URL 에서 saved 파라미터만 깔끔히 제거
    const params = new URLSearchParams(sp.toString());
    params.delete("saved");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 5rem)",
      }}
    >
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto rounded-full bg-foreground/95 px-5 py-2.5 text-sm font-medium text-background shadow-lg backdrop-blur"
      >
        ✓ {msg}
      </div>
    </div>
  );
}

export function SaveToast() {
  // useSearchParams 는 Suspense 바운더리 안에 있어야 함.
  return (
    <Suspense fallback={null}>
      <SaveToastInner />
    </Suspense>
  );
}
