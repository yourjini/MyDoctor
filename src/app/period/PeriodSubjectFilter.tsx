"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { PERSON_COLORS, type Person } from "@/lib/people";
import { cn } from "@/lib/utils";

export function PeriodSubjectFilter({
  current,
  subjects,
}: {
  current: string;
  subjects: readonly string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function select(s: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subject", s);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        pending && "opacity-60",
      )}
      role="tablist"
    >
      {subjects.map((s) => {
        const colors = PERSON_COLORS[s as Person] ?? PERSON_COLORS["전체"];
        const active = current === s;
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active ? colors.pillActive : colors.pill,
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
