"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// "건강자료" 1차 라벨 아래 3탭 — 질환 추적 / 검진 기록 / 첨부 자료.
// /conditions, /checkups, /attachments 세 라우트가 공유.

const TABS = [
  { href: "/conditions", label: "질환 추적" },
  { href: "/checkups", label: "검진 기록" },
  { href: "/attachments", label: "첨부 자료" },
] as const;

export function HealthDataTabs() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-4 flex gap-1 overflow-x-auto border-b"
      aria-label="건강자료 탭"
    >
      {TABS.map((t) => {
        const active =
          pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative min-h-11 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
