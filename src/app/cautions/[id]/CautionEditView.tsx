"use client";

import { useState } from "react";
import { SubjectBadge } from "@/components/SubjectBadge";
import { CautionForm } from "../CautionForm";
import { deleteCautionAction, updateCautionAction } from "../actions";
import { cn } from "@/lib/utils";
import type { CautionItem, CautionSeverity } from "@/lib/types";

const SEVERITY_META: Record<
  CautionSeverity,
  { label: string; chip: string }
> = {
  danger: { label: "🚨 절대 금지", chip: "bg-rose-600 text-white" },
  warning: { label: "⚠️ 강력 자제", chip: "bg-amber-500 text-white" },
  caution: { label: "가급적 자제", chip: "bg-slate-500 text-white" },
};

export function CautionEditView({ item }: { item: CautionItem }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CautionForm
        action={updateCautionAction}
        defaults={{
          name: item.name,
          subject: item.subject,
          severity: item.severity,
          category: item.category,
          medications: item.medications,
          reason: item.reason,
          source: item.source,
        }}
        hiddenInputs={{ id: item.id }}
        submitLabel="수정 저장"
      />
    );
  }

  const meta = SEVERITY_META[item.severity];

  return (
    <article className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SubjectBadge subject={item.subject} size="md" />
          <h1 className="text-xl font-semibold">{item.name}</h1>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              meta.chip,
            )}
          >
            {meta.label}
          </span>
        </div>
        {item.category && (
          <div className="text-xs text-muted-foreground">
            카테고리 · {item.category}
          </div>
        )}
      </header>

      {item.medications && item.medications.length > 0 && (
        <section>
          <h2 className="mb-1 text-xs font-medium text-muted-foreground">
            관련 약물
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {item.medications.map((m) => (
              <span
                key={m}
                className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800"
              >
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      {item.reason && (
        <section>
          <h2 className="mb-1 text-xs font-medium text-muted-foreground">
            이유 / 부작용
          </h2>
          <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm leading-6">
            {item.reason}
          </p>
        </section>
      )}

      {item.source && (
        <section>
          <h2 className="mb-1 text-xs font-medium text-muted-foreground">
            출처
          </h2>
          {/^https?:\/\//i.test(item.source) ? (
            <a
              href={item.source}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-primary hover:underline"
            >
              {item.source}
            </a>
          ) : (
            <p className="text-sm">{item.source}</p>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          수정하기
        </button>
        <form action={deleteCautionAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="rounded-md border border-rose-200 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
            onClick={(e) => {
              if (!confirm("이 주의 항목을 삭제할까요?")) {
                e.preventDefault();
              }
            }}
          >
            삭제
          </button>
        </form>
      </div>
    </article>
  );
}
