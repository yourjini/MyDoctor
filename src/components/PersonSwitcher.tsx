"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PERSON_COLORS, SUBJECT_COOKIE, type Person } from "@/lib/people";
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

export function PersonSwitcher({ current }: { current: Person }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(p: Person) {
    document.cookie = `${SUBJECT_COOKIE}=${encodeURIComponent(p)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        pending && "opacity-60",
      )}
      role="tablist"
      aria-label="보는 사람 선택"
    >
      <span className="text-[11px] text-muted-foreground">대상</span>
      {SELECTABLE.map((p) => {
        const active = current === p;
        const colors = PERSON_COLORS[p];
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => pick(p)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active ? colors.pillActive : colors.pill,
            )}
          >
            {SHORT[p] ?? p}
          </button>
        );
      })}
    </div>
  );
}
