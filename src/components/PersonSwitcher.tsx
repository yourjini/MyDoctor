"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PERSON_COLORS, SUBJECT_COOKIE, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";

// 전역 인물 선택기. 쿠키에 저장하고 새로고침 → 서버 컴포넌트가 읽어 반영.
const SELECTABLE: Person[] = ["박범진", "박란하", "최진희"];
const SHORT: Record<string, string> = {
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
      <span className="text-[11px] text-muted-foreground">보는 사람</span>
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
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
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
