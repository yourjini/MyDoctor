import Link from "next/link";

// Touch-friendly quick-add buttons. Toned down from solid accents to
// outline + kind-dot — the primary CTA ("+ 오늘 리포트 기록하기") lives
// on LanhaTodayCard, so these are secondary.

const ACTIONS = [
  {
    href: "/health/new",
    label: "리포트",
    sub: "기분·수면·체중",
    dot: "bg-rose-500",
  },
  {
    href: "/meals/new",
    label: "식사",
    sub: "메뉴·끼니",
    dot: "bg-teal-600",
  },
  {
    href: "/visits/new",
    label: "방문",
    sub: "병원·진단",
    dot: "bg-emerald-600",
  },
  {
    href: "/appointments/new",
    label: "예약",
    sub: "다음 진료",
    dot: "bg-amber-500",
  },
];

export function QuickActions() {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">빠른 입력</h2>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex min-h-[56px] items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 transition-colors hover:border-border hover:bg-accent/40"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.dot}`} />
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">
                + {a.label}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {a.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
