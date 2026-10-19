"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { isPerson, PERSON_COLORS, SUBJECT_COOKIE, type Person } from "@/lib/people";
import { setSubjectAction } from "@/lib/subject-action";
import { cn } from "@/lib/utils";

// 전역 인물 선택기. 쿠키에 저장하고 새로고침 → 서버 컴포넌트가 읽어 반영.
// "전체" 포함 — 홈 대시보드의 로컬 필터와 통합됐으므로 여기에만 존재.
// 순서: 전체 → 진희 → 란하 → 범진 (사용자 지정).
const SELECTABLE: Person[] = ["전체", "최진희", "박란하", "박범진"];
const SHORT: Record<string, string> = {
  전체: "전체",
  박범진: "범진",
  박란하: "란하",
  최진희: "진희",
};

// 쿠키에서 현재 선택된 인물을 읽음. Next.js Router Cache 가 이전 페이지의
// 렌더 상태를 잠깐 보여주는 바람에 PersonSwitcher 가 깜빡거리는 걸 막기 위해
// 클라이언트에서 쿠키를 직접 재확인 → self-correct.
function readCookieSubject(): Person | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SUBJECT_COOKIE}=([^;]+)`),
  );
  if (!match) return null;
  try {
    const v = decodeURIComponent(match[1]);
    return isPerson(v) ? v : null;
  } catch {
    return null;
  }
}

export function PersonSwitcher({ current }: { current: Person }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // 서버에서 받은 current 를 initial HTML 용 초기값으로만 사용. hydration
  // 후에는 "쿠키가 진실" — 라우트가 바뀌어 current prop 이 다른 값으로
  // 넘어와도 쿠키 기반 state 를 유지. (이전엔 current 가 바뀔 때마다
  // useEffect 가 재실행되어 /conditions ↔ /checkups 탭 전환 시 Router
  // Cache 가 다른 current 를 돌려주면 란하 선택이 깜빡거렸음.)
  const [active, setActive] = useState<Person>(current);

  useEffect(() => {
    const fromCookie = readCookieSubject();
    if (fromCookie) setActive(fromCookie);
    // 마운트 한 번만. current prop 변경은 무시 (쿠키 == state 가 유일한 진실).
  }, []);

  function pick(p: Person) {
    // 즉시 UI 반영 — 사용자가 느리게 네트워크 왕복을 기다리지 않도록.
    setActive(p);
    startTransition(async () => {
      // Server action 이 쿠키 세팅 + revalidatePath("/", "layout") 로 모든
      // 라우트의 캐시를 날림. 이걸 안 하면 Next.js Router Cache 가 각 탭의
      // "이전 subject" 로 렌더된 결과를 재사용해 탭 전환마다 깜빡거린다.
      // document.cookie 세팅은 fallback — 쿠키가 client 에서도 즉시 반영돼
      // readCookieSubject() 가 다음 마운트 때 올바른 값을 읽음.
      try {
        document.cookie = `${SUBJECT_COOKIE}=${encodeURIComponent(p)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      } catch {
        // ignore
      }
      await setSubjectAction(p);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        pending && "opacity-60",
      )}
      role="tablist"
      aria-label="대상 선택"
    >
      <span className="text-[11px] text-muted-foreground">대상</span>
      {SELECTABLE.map((p) => {
        const isActive = active === p;
        const colors = PERSON_COLORS[p];
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => pick(p)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? colors.pillActive : colors.pill,
            )}
          >
            {SHORT[p] ?? p}
          </button>
        );
      })}
    </div>
  );
}
