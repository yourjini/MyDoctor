"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { asPerson, PEOPLE, PERSON_COLORS, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";

export function SubjectFilter({
  defaultPerson = "전체",
}: {
  // 어느 인물을 "기본값(= URL 파라미터 없음)"으로 볼지. 페이지별로 다름.
  defaultPerson?: Person;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const rawParam = searchParams.get("subject");
  const current: Person =
    rawParam == null ? defaultPerson : asPerson(rawParam);

  function selectPerson(p: Person) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === defaultPerson) params.delete("subject");
    else params.set("subject", p);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        pending && "opacity-60",
      )}
      role="tablist"
      aria-label="대상자 필터"
    >
      {PEOPLE.map((p) => {
        const active = current === p;
        const colors = PERSON_COLORS[p];
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectPerson(p)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active ? colors.pillActive : colors.pill,
            )}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
