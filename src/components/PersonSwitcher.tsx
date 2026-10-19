"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { isPerson, PERSON_COLORS, SUBJECT_COOKIE, type Person } from "@/lib/people";
import { setSubjectAction } from "@/lib/subject-action";
import { cn } from "@/lib/utils";

// 전역 인물 선택기. 쿠키에 저장되고 서버가 이를 읽어 데이터 필터링.
//
// 두 가지 깜빡임 모두 방지:
//  (a) 라우트 전환 때 Router Cache 가 돌려주는 current prop 변화에 반응
//      금지 — useState 는 마운트 1회만 initial 값을 쓰므로 current prop
//      이 변경돼도 state 는 유지됨. Nav 가 layout 에 있어 persistent
//      이므로 PersonSwitcher 는 unmount 안 됨 → state 영구 유지.
//  (b) 첫 로드 때 서버 current prop 을 initial state 로 사용 → SSR
//      결과가 바로 올바른 사람 하이라이트. hydration 시 쿠키 보정은
//      initial 과 같은 값이라 변화 없음 (깜빡임 없음).
const SELECTABLE: Person[] = ["전체", "최진희", "박란하", "박범진"];
const SHORT: Record<string, string> = {
  전체: "전체",
  박범진: "범진",
  박란하: "란하",
  최진희: "진희",
};

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

export function PersonSwitcher({ current }: { current?: Person } = {}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // 서버 current (쿠키 값과 동일) 를 initial state 로. 라우트 전환 시
  // Nav 가 persistent 라 remount 안 됨 → useState initial 은 1회만 쓰여
  // 서버가 다른 current 를 보내도 state 는 유지됨.
  const [active, setActive] = useState<Person>(current ?? "전체");

  useEffect(() => {
    // 혹시 쿠키와 서버 current 가 어긋났을 때 (앱 외부에서 쿠키 변경 등)
    // 마운트 때 한 번 보정. 보통은 같은 값이라 no-op.
    const fromCookie = readCookieSubject();
    if (fromCookie && fromCookie !== active) setActive(fromCookie);
    // 마운트 1회만 — current prop 변경 무시해야 깜빡임 안 생김.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(p: Person) {
    setActive(p);
    startTransition(async () => {
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
