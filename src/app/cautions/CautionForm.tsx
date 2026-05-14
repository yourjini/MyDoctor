"use client";

import { useState } from "react";
import { PEOPLE } from "@/lib/people";
import type { CautionItem, CautionSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_OPTIONS: {
  value: CautionSeverity;
  label: string;
  className: string;
}[] = [
  {
    value: "danger",
    label: "🚨 절대 금지",
    className:
      "border-rose-300 bg-rose-50 text-rose-800 peer-checked:bg-rose-600 peer-checked:text-white peer-checked:border-rose-600",
  },
  {
    value: "warning",
    label: "⚠️ 강력 자제",
    className:
      "border-amber-300 bg-amber-50 text-amber-800 peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500",
  },
  {
    value: "caution",
    label: "가급적 자제",
    className:
      "border-slate-300 bg-slate-50 text-slate-700 peer-checked:bg-slate-600 peer-checked:text-white peer-checked:border-slate-600",
  },
];

const CATEGORY_OPTIONS = ["술", "카페인", "자극적", "식품", "약물", "기타"];

export type CautionFormDefaults = Partial<
  Pick<
    CautionItem,
    | "name"
    | "subject"
    | "severity"
    | "category"
    | "medications"
    | "reason"
    | "source"
  >
>;

export function CautionForm({
  action,
  defaults,
  hiddenInputs,
  submitLabel = "저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: CautionFormDefaults;
  hiddenInputs?: Record<string, string>;
  submitLabel?: string;
}) {
  const [category, setCategory] = useState<string>(defaults?.category ?? "");
  const [customCategory, setCustomCategory] = useState<string>(
    defaults?.category && !CATEGORY_OPTIONS.includes(defaults.category)
      ? defaults.category
      : "",
  );
  const effectiveCategory = category === "__custom" ? customCategory : category;

  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      {hiddenInputs &&
        Object.entries(hiddenInputs).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input type="hidden" name="category" value={effectiveCategory} />

      <Field label="이름" required>
        <input
          type="text"
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          placeholder="예: 맥주, 자몽, 마라탕"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="대상자">
        <select
          name="subject"
          defaultValue={defaults?.subject ?? "박란하"}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
        >
          {PEOPLE.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <Field label="위험도">
        <div className="flex flex-wrap gap-1.5">
          {SEVERITY_OPTIONS.map((o) => (
            <label key={o.value} className="cursor-pointer">
              <input
                type="radio"
                name="severity"
                value={o.value}
                defaultChecked={(defaults?.severity ?? "caution") === o.value}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "inline-block rounded-md border px-3 py-1.5 text-xs font-medium",
                  o.className,
                )}
              >
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="카테고리">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_OPTIONS.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(active ? "" : c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "bg-background hover:bg-accent",
                )}
              >
                {c}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCategory("__custom")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              category === "__custom"
                ? "border-foreground bg-foreground text-background"
                : "bg-background hover:bg-accent",
            )}
          >
            직접 입력
          </button>
        </div>
        {category === "__custom" && (
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="카테고리 이름"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        )}
      </Field>

      <Field label="관련 약물 (쉼표 구분)">
        <input
          type="text"
          name="medications"
          defaultValue={defaults?.medications?.join(", ") ?? ""}
          placeholder="예: 자나팜, 리튬, 콘서타"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="이유 / 부작용">
        <textarea
          name="reason"
          rows={6}
          defaultValue={defaults?.reason ?? ""}
          placeholder="왜 위험한지, 어떤 부작용이 있는지…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-6"
        />
      </Field>

      <Field label="출처 / 메모">
        <input
          type="text"
          name="source"
          defaultValue={defaults?.source ?? ""}
          placeholder="URL 또는 의사 소견 등"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <div>
        <button
          type="submit"
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      {children}
    </div>
  );
}
