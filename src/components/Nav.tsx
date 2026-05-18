"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Navigation structure
//
// Mobile (<sm): top bar shows logo + "더보기" overflow only. A fixed
// bottom tab bar exposes 5 primary actions — chosen so 박란하's daily
// tracking (건강일지, 식단) is always one tap away.
//
// Desktop (>=sm): grouped top-bar dropdowns:
//   의료기록  = 방문이력 / 예약 / 건강검진
//   건강추적  = 건강일지 / 그래프 / 생리주기 / 식단
//   프로필
// ----------------------------------------------------------------------

type LeafLink = { href: string; label: string; icon?: (p: { className?: string }) => React.ReactElement };

const ALL_LINKS: Record<string, LeafLink> = {
  home: { href: "/", label: "오늘", icon: IconHome },
  visits: { href: "/visits", label: "방문이력", icon: IconStethoscope },
  appointments: { href: "/appointments", label: "예약", icon: IconCalendar },
  checkups: { href: "/checkups", label: "건강검진", icon: IconClipboard },
  health: { href: "/health", label: "건강일지", icon: IconHeart },
  chart: { href: "/health/chart", label: "그래프", icon: IconChart },
  period: { href: "/period", label: "생리주기", icon: IconDrop },
  meals: { href: "/meals", label: "식단", icon: IconUtensils },
  cautions: { href: "/cautions", label: "주의음식", icon: IconAlert },
  notes: { href: "/notes", label: "선생님메모", icon: IconNote },
  diary: { href: "/diary", label: "다이어리", icon: IconLock },
  profile: { href: "/profile", label: "프로필", icon: IconUser },
};

// Bottom tab bar — 5 most-tapped destinations for the parent on mobile.
const BOTTOM_TABS = [
  ALL_LINKS.home,
  ALL_LINKS.health,
  ALL_LINKS.meals,
  ALL_LINKS.appointments,
];

// Overflow drawer (mobile "더보기"): everything not in the bottom tabs.
const MORE_LINKS = [
  ALL_LINKS.visits,
  ALL_LINKS.checkups,
  ALL_LINKS.period,
  ALL_LINKS.chart,
  ALL_LINKS.cautions,
  ALL_LINKS.notes,
  ALL_LINKS.diary,
  ALL_LINKS.profile,
];

// Desktop grouped clusters.
const DESKTOP_GROUPS: { label: string; items: LeafLink[] }[] = [
  {
    label: "의료기록",
    items: [
      ALL_LINKS.visits,
      ALL_LINKS.appointments,
      ALL_LINKS.checkups,
      ALL_LINKS.notes,
    ],
  },
  {
    label: "건강추적",
    items: [
      ALL_LINKS.health,
      ALL_LINKS.chart,
      ALL_LINKS.period,
      ALL_LINKS.meals,
      ALL_LINKS.cautions,
      ALL_LINKS.diary,
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const desktopRef = useRef<HTMLDivElement | null>(null);

  // Close menus on route change.
  useEffect(() => {
    setMoreOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  // Click-outside for desktop dropdowns.
  useEffect(() => {
    if (!openGroup) return;
    function onClick(e: MouseEvent) {
      if (!desktopRef.current) return;
      if (!desktopRef.current.contains(e.target as Node)) setOpenGroup(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openGroup]);

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function groupActive(items: LeafLink[]) {
    return items.some((i) => isActive(i.href));
  }

  return (
    <>
      {/* ─── Top bar ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="container-narrow flex items-center justify-between gap-2 py-3">
          <Link href="/" className="text-lg font-semibold">
            MyDoctor
          </Link>

          {/* Desktop grouped nav */}
          <div ref={desktopRef} className="hidden items-center gap-1 sm:flex">
            <Link
              href={ALL_LINKS.home.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                isActive("/")
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              오늘
            </Link>

            {DESKTOP_GROUPS.map((g) => {
              const open = openGroup === g.label;
              const active = groupActive(g.items);
              return (
                <div key={g.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(open ? null : g.label)}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60",
                    )}
                  >
                    {g.label}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn(
                        "transition-transform",
                        open && "rotate-180",
                      )}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {open && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-30 mt-1 min-w-[160px] overflow-hidden rounded-md border bg-card shadow-md"
                    >
                      {g.items.map((it) => (
                        <Link
                          key={it.href}
                          href={it.href}
                          role="menuitem"
                          className={cn(
                            "block px-3 py-2 text-sm",
                            isActive(it.href)
                              ? "bg-accent font-medium"
                              : "hover:bg-accent/60",
                          )}
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              href={ALL_LINKS.profile.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                isActive(ALL_LINKS.profile.href)
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              프로필
            </Link>

            <button
              onClick={logout}
              className="ml-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/60"
              title="로그아웃"
            >
              로그아웃
            </button>
          </div>

          {/* Mobile overflow button (top-right) */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="더보기"
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

        {/* Mobile overflow drawer */}
        {moreOpen && (
          <div className="border-t sm:hidden">
            <div className="container-narrow grid grid-cols-2 gap-1 py-2">
              {MORE_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 rounded-md px-3 py-2 text-sm",
                      isActive(l.href)
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-foreground/80 hover:bg-accent/60",
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {l.label}
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="col-span-2 mt-1 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60"
              >
                로그아웃
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Mobile bottom tab bar ─────────────────────────────────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-3xl items-stretch">
          {BOTTOM_TABS.map((l) => {
            const Icon = l.icon!;
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "stroke-[2.2]" : "stroke-[1.8]",
                  )}
                />
                <span className={cn(active && "font-medium")}>{l.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px]",
              moreOpen ? "text-primary" : "text-muted-foreground",
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

// ----------------------------------------------------------------------
// Inline icons (no extra deps). Stroke-based for crisp scaling.
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
