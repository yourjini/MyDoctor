"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "캘린더" },
  { href: "/visits", label: "방문이력" },
  { href: "/appointments", label: "예약" },
  { href: "/checkups", label: "건강검진" },
  { href: "/health", label: "건강일지" },
  { href: "/period", label: "생리주기" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="container-narrow flex items-center justify-between py-3">
        <Link href="/" className="font-semibold text-lg">
          MyDoctor
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                isActive(l.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="ml-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/60"
            title="로그아웃"
          >
            로그아웃
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴"
          aria-expanded={open}
          className="rounded-md p-2 hover:bg-accent/60 sm:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {open ? (
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

      {open && (
        <div className="border-t sm:hidden">
          <div className="container-narrow flex flex-col gap-1 py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  isActive(l.href)
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="mt-1 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
