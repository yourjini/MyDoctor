import Link from "next/link";

// Touch-friendly quick-add buttons. Each tile is ≥44px tall and uses the
// kind's solid accent color from KIND_STYLES (rose / emerald / amber).

const ACTIONS = [
  {
    href: "/health/new",
    label: "리포트",
    sub: "기분·수면·체중",
    cls: "bg-rose-500 hover:bg-rose-600",
  },
  {
    href: "/meals/new",
    label: "식사",
    sub: "메뉴·끼니",
    cls: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    href: "/visits/new",
    label: "방문",
    sub: "병원·진단",
    cls: "bg-emerald-700 hover:bg-emerald-800",
  },
  {
    href: "/appointments/new",
    label: "예약",
    sub: "다음 진료",
    cls: "bg-amber-500 hover:bg-amber-600",
  },
];

export function QuickActions() {
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        빠른 입력
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex min-h-[60px] flex-col items-start justify-center gap-0.5 rounded-lg px-3 py-2.5 text-white shadow-sm transition-colors ${a.cls}`}
          >
            <span className="text-sm font-semibold leading-tight">
              + {a.label}
            </span>
            <span className="text-[10px] opacity-90">{a.sub}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
