"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/people";
import { PersonSwitcher } from "./PersonSwitcher";

// ----------------------------------------------------------------------
// 모바일·데스크탑이 같은 정보 구조를 쓴다. 항목·라벨·그룹 모두 동일.
// 시각만 다름: 모바일은 상단(로고+더보기) + 하단탭, 데스크탑은 상단바
// (로고 + 1차 탭 + 더보기) 한 줄.
//
// 1차(가장 자주): 오늘 · 건강일지 · 그래프(란하 양극성) · 방문이력 · 예약
// 더보기: 의료기록 / 건강추적 / 기타
// ----------------------------------------------------------------------

type LeafLink = {
  href: string;
  label: string;
  short?: string; // 모바일 하단탭용 짧은 라벨
  icon: (p: { className?: string }) => React.ReactElement;
};

const PRIMARY: LeafLink[] = [
  { href: "/", label: "오늘", icon: IconHome },
  { href: "/health", label: "데일리리포트", short: "리포트", icon: IconHeart },
  { href: "/conditions", label: "건강일지", icon: IconPulse },
  { href: "/visits", label: "방문이력", short: "방문", icon: IconStethoscope },
];

const SECONDARY_GROUPS: { label: string; items: LeafLink[] }[] = [
  {
    label: "데일리리포트",
    items: [
      { href: "/health/chart", label: "그래프", icon: IconChart },
      { href: "/diary", label: "다이어리", icon: IconLock },
    ],
  },
  {
    label: "병원 진료",
    items: [
      { href: "/appointments", label: "예약", icon: IconCalendar },
      { href: "/checkups", label: "건강검진", icon: IconClipboard },
    ],
  },
  {
    label: "기타",
    items: [
      { href: "/meals", label: "식단", icon: IconUtensils },
      { href: "/period", label: "생리주기", icon: IconDrop },
      { href: "/cautions", label: "주의음식", icon: IconAlert },
      { href: "/notes", label: "선생님메모", icon: IconNote },
      { href: "/profile", label: "프로필", icon: IconUser },
    ],
  },
];

const ALL_HREFS = [
  ...PRIMARY,
  ...SECONDARY_GROUPS.flatMap((g) => g.items),
].map((i) => i.href);

// 현재 경로에 가장 구체적으로 매칭되는 href 하나만 활성. /health 와
// /health/chart 가 동시에 켜지는 문제 방지 (가장 긴 접두사가 승리).
function activeHrefFor(pathname: string): string {
  if (pathname === "/") return "/";
  let best = "";
  for (const h of ALL_HREFS) {
    if (h === "/") continue;
    if (pathname === h || pathname.startsWith(h + "/")) {
      if (h.length > best.length) best = h;
    }
  }
  return best;
}

export function Nav({
  currentPerson = "박란하",
}: {
  currentPerson?: Person;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const active = activeHrefFor(pathname);
  const isActive = (href: string) => href === active;
  const moreActive = SECONDARY_GROUPS.some((g) =>
    g.items.some((it) => it.href === active),
  );

  // 라우트 변경 시 더보기 닫기
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Escape 로 닫기
  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    setMoreOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* 바깥 클릭용 백드롭. 토글 버튼/패널은 z-40 으로 이 위에 있어
          서로 싸우지 않음 (이전 mousedown 레이스 버그 제거). */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 sm:bg-transparent"
          aria-hidden
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* ─── 상단 바 ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="container-narrow flex items-center justify-between gap-2 py-3">
          <Link href="/" className="text-lg font-semibold">
            MyDoctor
          </Link>

          {/* 데스크탑: 1차 탭 + 더보기 (≥sm) */}
          <div className="hidden items-center gap-1 sm:flex">
            {PRIMARY.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  isActive(l.href)
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm",
                  moreActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                더보기
                <Chevron open={moreOpen} />
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-md border bg-card shadow-lg"
                >
                  <MoreContent isActive={isActive} onLogout={logout} />
                </div>
              )}
            </div>
          </div>

          {/* 모바일: 햄버거/X 더보기 (<sm) */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label={moreOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={moreOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent/60 sm:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {moreOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* 전역 인물 선택 행 — 모바일·데스크탑 공통, 항상 보임 */}
        <div className="border-t bg-background/60">
          <div className="container-narrow flex items-center justify-center py-1.5 sm:justify-start">
            <PersonSwitcher current={currentPerson} />
          </div>
        </div>

        {/* 모바일 더보기 드로어 (상단바 아래로 펼침) */}
        {moreOpen && (
          <div className="border-t bg-card sm:hidden">
            <div className="container-narrow max-h-[70vh] overflow-y-auto py-1">
              <MoreContent isActive={isActive} onLogout={logout} />
            </div>
          </div>
        )}
      </nav>

      {/* ─── 모바일 하단 탭 바 ───────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-3xl items-stretch">
          {PRIMARY.map((l) => (
            <BottomTab key={l.href} link={l} active={isActive(l.href)} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
              moreActive || moreOpen ? "text-primary" : "text-muted-foreground",
            )}
            aria-label="더보기"
          >
            <IconMore className="h-5 w-5 stroke-[1.8]" />
            <span>더보기</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── 공통 더보기 콘텐츠 (모바일·데스크탑 동일) ───────────────────
function MoreContent({
  isActive,
  onLogout,
}: {
  isActive: (href: string) => boolean;
  onLogout: () => void;
}) {
  return (
    <div className="divide-y">
      {SECONDARY_GROUPS.map((g) => (
        <section key={g.label} className="p-2">
          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {g.label}
          </div>
          <ul>
            {g.items.map((it) => {
              const Icon = it.icon;
              const active = isActive(it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    role="menuitem"
                    className={cn(
                      "flex min-h-[40px] items-center gap-2.5 rounded-md px-2 py-2 text-sm",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "hover:bg-accent/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{it.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <section className="p-2">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-[40px] w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60"
        >
          <IconLogout className="h-4 w-4 shrink-0" />
          로그아웃
        </button>
      </section>
    </div>
  );
}

function BottomTab({ link, active }: { link: LeafLink; active: boolean }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
        active ? "text-primary" : "text-muted-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("h-5 w-5", active ? "stroke-[2.2]" : "stroke-[1.8]")} />
      <span className={cn(active && "font-medium")}>{link.short ?? link.label}</span>
    </Link>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("transition-transform", open && "rotate-180")}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ----------------------------------------------------------------------
// 인라인 아이콘 (외부 의존성 제거). stroke 기반으로 크기 변경에 강함.
// ----------------------------------------------------------------------

function svg(children: React.ReactNode, className?: string) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return svg(
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </>,
    className,
  );
}
function IconHeart({ className }: { className?: string }) {
  return svg(
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    className,
  );
}
function IconUtensils({ className }: { className?: string }) {
  return svg(
    <>
      <path d="M3 3v8a3 3 0 0 0 3 3v7" />
      <path d="M9 3v8a3 3 0 0 1-3 3" />
      <path d="M6 14v7" />
      <path d="M15 3v18" />
      <path d="M18 3c1.5 0 3 1 3 4v6a2 2 0 0 1-2 2h-1V3z" />
    </>,
    className,
  );
}
function IconCalendar({ className }: { className?: string }) {
  return svg(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>,
    className,
  );
}
function IconMore({ className }: { className?: string }) {
  return svg(
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>,
    className,
  );
}
function IconStethoscope({ className }: { className?: string }) {
  return svg(
    <>
      <path d="M5 3v6a4 4 0 0 0 8 0V3" />
      <path d="M5 3h2" />
      <path d="M11 3h2" />
      <path d="M9 13v3a5 5 0 0 0 10 0v-1" />
      <circle cx="19" cy="14" r="2" />
    </>,
    className,
  );
}
function IconClipboard({ className }: { className?: string }) {
  return svg(
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>,
    className,
  );
}
function IconChart({ className }: { className?: string }) {
  return svg(
    <>
      <path d="M3 3v18h18" />
      <polyline points="7 14 11 10 14 13 20 7" />
    </>,
    className,
  );
}
function IconPulse({ className }: { className?: string }) {
  return svg(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 12h4l2-4 3 8 2-5 1 1h6" />
    </>,
    className,
  );
}
function IconDrop({ className }: { className?: string }) {
  return svg(
    <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
    className,
  );
}
function IconUser({ className }: { className?: string }) {
  return svg(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>,
    className,
  );
}
function IconLock({ className }: { className?: string }) {
  return svg(
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>,
    className,
  );
}
function IconAlert({ className }: { className?: string }) {
  return svg(
    <>
      <path d="M12 3 2 21h20L12 3z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </>,
    className,
  );
}
function IconNote({ className }: { className?: string }) {
  return svg(
    <>
      <path d="M4 4h11l5 5v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <polyline points="15 4 15 9 20 9" />
      <line x1="7" y1="13" x2="15" y2="13" />
      <line x1="7" y1="17" x2="13" y2="17" />
    </>,
    className,
  );
}
function IconLogout({ className }: { className?: string }) {
  return svg(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>,
    className,
  );
}
