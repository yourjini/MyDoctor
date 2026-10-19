"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { isPerson, PERSON_COLORS, SUBJECT_COOKIE, type Person } from "@/lib/people";
import { setSubjectAction } from "@/lib/subject-action";
import { cn } from "@/lib/utils";

// 전역 인물 선택기. 쿠키에 저장되고, 서버 컴포넌트는 쿠키를 읽어 그 사람의
// 데이터로 필터링. 사용자가 pick 하면 server action 이 쿠키 세팅 +
// revalidatePath("/", "layout") 으로 전체 route cache 를 날린 뒤 refresh.
//
// 왜 current prop 안 받나?
//   서버에서 current 를 받으면, 라우트 전환 시 서버가 다른 캐시된 current
//   를 돌려주면 그 순간이 번쩍 보이는 깜빡임 발생. 그래서 PersonSwitcher
//   는 서버 상태 무시, hydration 때 쿠키에서 직접 읽음. hydration 전엔
//   플레이스홀더만 노출 → 라우트가 뭐든 보이는 상태가 100% 일관.
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

export function PersonSwitcher() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // null = hydration 전. 서버 render 는 null → 플레이스홀더만. hydrate
  // 되자마자 쿠키에서 복원하므로 사람 사이 깜빡임 없음.
  const [active, setActive] = useState<Person | null>(null);

  useEffect(() => {
    const fromCookie = readCookieSubject() ?? "전체";
    setActive(fromCookie);
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

  // Hydration 전 — 아무 사람도 하이라이트 안 함. 레이아웃만 유지.
  if (active == null) {
    return (
      <div
        className="flex items-center gap-1.5"
        role="tablist"
        aria-label="대상 선택"
      >
        <span className="text-[11px] text-muted-foreground">대상</span>
        {SELECTABLE.map((p) => (
          <span
            key={p}
            className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {SHORT[p] ?? p}
          </span>
        ))}
      </div>
    );
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
