"use client";

import { useState } from "react";
import { PEOPLE } from "@/lib/people";
import { BODY_PARTS, STATUS_LIST, STATUS_META } from "@/lib/health-conditions";
import type { HealthCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ConditionFormDefaults = Partial<
  Pick<
    HealthCondition,
    "subject" | "bodyPart" | "diagnosis" | "status" | "summary" | "nextAction" | "nextDate"
  >
>;

export function ConditionForm({
  action,
  defaults,
  hiddenInputs,
  submitLabel = "저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: ConditionFormDefaults;
  hiddenInputs?: Record<string, string>;
  submitLabel?: string;
}) {
  const presetPart = defaults?.bodyPart && BODY_PARTS.includes(defaults.bodyPart as never);
  const [bodyPart, setBodyPart] = useState<string>(
    presetPart ? (defaults!.bodyPart as string) : defaults?.bodyPart ? "__custom" : "유방",
  );
  const [customPart, setCustomPart] = useState<string>(
    !presetPart && defaults?.bodyPart ? defaults.bodyPart : "",
  );
  const effectivePart = bodyPart === "__custom" ? customPart : bodyPart;

  const [status, setStatus] = useState(defaults?.status ?? "추적중");

  return (
    <form action={action} className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      {hiddenInputs &&
        Object.entries(hiddenInputs).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input type="hidden" name="bodyPart" value={effectivePart} />
      <input type="hidden" name="status" value={status} />

      <Field label="부위" required>
        <div className="flex flex-wrap gap-1.5">
          {BODY_PARTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBodyPart(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                bodyPart === p
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background hover:bg-accent",
              )}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setBodyPart("__custom")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              bodyPart === "__custom"
                ? "border-foreground bg-foreground text-background"
                : "bg-background hover:bg-accent",
            )}
          >
            직접 입력
          </button>
        </div>
        {bodyPart === "__custom" && (
          <input
            type="text"
            value={customPart}
            onChange={(e) => setCustomPart(e.target.value)}
            placeholder="부위 이름"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        )}
      </Field>

      <Field label="진단명" required>
        <input
          type="text"
          name="diagnosis"
          required
          defaultValue={defaults?.diagnosis ?? ""}
          placeholder="예: 우측 17mm 결절, 양성 섬유선종"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="대상자">
        <select
          name="subject"
          defaultValue={defaults?.subject ?? "최진희"}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
        >
          {PEOPLE.filter((p) => p !== "전체").map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <Field label="상태">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                status === s
                  ? STATUS_META[s].chip + " border-transparent"
                  : "bg-background hover:bg-accent",
              )}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="요약">
        <textarea
          name="summary"
          rows={3}
          defaultValue={defaults?.summary ?? ""}
          placeholder="현재 상태 요약"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-6"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="다음 일정 / 액션">
          <input
            type="text"
            name="nextAction"
            defaultValue={defaults?.nextAction ?? ""}
            placeholder="예: 2026.08 복부 CT"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="다음 일정 날짜 (선택)">
          <input
            type="date"
            name="nextDate"
            defaultValue={defaults?.nextDate ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
