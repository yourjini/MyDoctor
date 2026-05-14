import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SubjectBadge } from "@/components/SubjectBadge";
import { listCautions } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { CautionItem, CautionSeverity } from "@/lib/types";

export const dynamic = "force-dynamic";

const SEVERITY_META: Record<
  CautionSeverity,
  { label: string; chip: string; card: string }
> = {
  danger: {
    label: "🚨 절대 금지",
    chip: "bg-rose-600 text-white",
    card: "border-rose-200",
  },
  warning: {
    label: "⚠️ 강력 자제",
    chip: "bg-amber-500 text-white",
    card: "border-amber-200",
  },
  caution: {
    label: "가급적 자제",
    chip: "bg-slate-500 text-white",
    card: "border-slate-200",
  },
};

const SEVERITY_ORDER: CautionSeverity[] = ["danger", "warning", "caution"];

export default async function CautionsPage() {
  const items = await listCautions();

  const bySeverity = new Map<CautionSeverity, CautionItem[]>();
  for (const it of items) {
    const arr = bySeverity.get(it.severity) ?? [];
    arr.push(it);
    bySeverity.set(it.severity, arr);
  }

  return (
    <PageShell
      title="주의 음식·음료"
      action={
        <Link
          href="/cautions/new"
          className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
        >
          + 항목 추가
        </Link>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        약물과 상호작용하거나 부작용을 일으킬 수 있는 음식·음료·약물을 모아둡니다.
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          등록된 항목이 없습니다. 우상단 &quot;+ 항목 추가&quot;로 시작하세요.
        </p>
      ) : (
        <div className="space-y-6">
          {SEVERITY_ORDER.map((sev) => {
            const list = bySeverity.get(sev);
            if (!list || list.length === 0) return null;
            const meta = SEVERITY_META[sev];
            return (
              <section key={sev}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      meta.chip,
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="text-muted-foreground">
                    {list.length}건
                  </span>
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((it) => (
                    <CautionCard key={it.id} item={it} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function CautionCard({ item }: { item: CautionItem }) {
  const meta = SEVERITY_META[item.severity];
  return (
    <Link
      href={`/cautions/${item.id}`}
      className={cn(
        "block rounded-lg border bg-card p-3 hover:bg-accent/40",
        meta.card,
      )}
    >
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <SubjectBadge subject={item.subject} size="sm" />
        <span className="font-medium">{item.name}</span>
        {item.category && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {item.category}
          </span>
        )}
      </div>
      {item.medications && item.medications.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {item.medications.slice(0, 4).map((m) => (
            <span
              key={m}
              className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700"
            >
              {m}
            </span>
          ))}
          {item.medications.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{item.medications.length - 4}
            </span>
          )}
        </div>
      )}
      {item.reason && (
        <p className="line-clamp-3 text-xs text-muted-foreground">
          {item.reason}
        </p>
      )}
    </Link>
  );
}
