"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { asPerson, PEOPLE, PERSON_COLORS, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";

export function SubjectFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = asPerson(searchParams.get("subject") ?? undefined);

  function selectPerson(p: Person) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === "전체") params.delete("subject");
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
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
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
