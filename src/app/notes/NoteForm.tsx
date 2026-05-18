"use client";

import { useState } from "react";
import { PEOPLE } from "@/lib/people";
import type { ClinicNote, ClinicNoteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOSPITAL_TYPE_OPTIONS = [
  "정신건강의학과",
  "내과",
  "산부인과",
  "소아청소년과",
  "피부과",
  "안과",
  "이비인후과",
  "치과",
  "정형외과",
  "한의원",
  "기타",
];

export type NoteFormDefaults = Partial<
  Pick<
    ClinicNote,
    "subject" | "title" | "body" | "hospitalType" | "tags" | "status"
  >
>;

export function NoteForm({
  action,
  defaults,
  hiddenInputs,
  submitLabel = "저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: NoteFormDefaults;
  hiddenInputs?: Record<string, string>;
  submitLabel?: string;
}) {
  const [hospitalType, setHospitalType] = useState<string>(
    defaults?.hospitalType ?? "",
  );
  const [customHospital, setCustomHospital] = useState<string>(
    defaults?.hospitalType && !HOSPITAL_TYPE_OPTIONS.includes(defaults.hospitalType)
      ? defaults.hospitalType
      : "",
  );
  const effectiveHospital =
    hospitalType === "__custom" ? customHospital : hospitalType;

  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      {hiddenInputs &&
        Object.entries(hiddenInputs).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input type="hidden" name="hospitalType" value={effectiveHospital} />

      <Field label="제목">
        <input
          type="text"
          name="title"
          defaultValue={defaults?.title ?? ""}
          placeholder="예: 약 줄여달라고 부탁하기"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="내용" required>
        <textarea
          name="body"
          required
          rows={6}
          defaultValue={defaults?.body ?? ""}
          placeholder="선생님께 어떤 말씀을 드릴지, 어떤 질문을 할지…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-6"
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

      <Field label="병원 분류">
        <div className="flex flex-wrap gap-1.5">
          {HOSPITAL_TYPE_OPTIONS.map((h) => {
            const active = hospitalType === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHospitalType(active ? "" : h)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "bg-background hover:bg-accent",
                )}
              >
                {h}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setHospitalType("__custom")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              hospitalType === "__custom"
                ? "border-foreground bg-foreground text-background"
                : "bg-background hover:bg-accent",
            )}
          >
            직접 입력
          </button>
        </div>
        {hospitalType === "__custom" && (
          <input
            type="text"
            value={customHospital}
            onChange={(e) => setCustomHospital(e.target.value)}
            placeholder="병원 분류"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        )}
      </Field>

      <Field label="태그 (쉼표 구분)">
        <input
          type="text"
          name="tags"
          defaultValue={defaults?.tags?.join(", ") ?? ""}
          placeholder="예: 약 부작용, 수면, 체중"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="상태">
        <StatusToggle defaultValue={defaults?.status ?? "pending"} />
      </Field>

      <div>
        <button
          type="submit"
          className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function StatusToggle({ defaultValue }: { defaultValue: ClinicNoteStatus }) {
  const [status, setStatus] = useState<ClinicNoteStatus>(defaultValue);
  return (
    <>
      <input type="hidden" name="status" value={status} />
      <div className="flex gap-1.5">
        {(["pending", "done"] as const).map((s) => {
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs",
                active
                  ? s === "done"
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-foreground bg-foreground text-background"
                  : "bg-background hover:bg-accent",
              )}
            >
              {s === "pending" ? "🕒 대기" : "✅ 전달함"}
            </button>
          );
        })}
      </div>
    </>
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
