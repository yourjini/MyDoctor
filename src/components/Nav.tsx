"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "캘린더" },
  { href: "/visits", label: "방문이력" },
  { href: "/appointments", label: "예약" },
  { href: "/checkups", label: "건강검진" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="container-narrow flex items-center justify-between py-3">
        <Link href="/" className="font-semibold text-lg">
          MyDoctor
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="ml-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/60"
            title="로그아웃"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
