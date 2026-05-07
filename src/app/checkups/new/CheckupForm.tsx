"use client";

import { useRef } from "react";
import { FilePicker } from "@/components/FilePicker";
import { SubjectSelect } from "@/components/SubjectSelect";
import { createCheckupAction } from "../actions";
import { maybeConvertLargePdfs } from "../fileTransform";

export function CheckupForm({ initialDate }: { initialDate?: string } = {}) {
  const today = initialDate ?? new Date().toISOString().slice(0, 10);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={createCheckupAction}
      encType="multipart/form-data"
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          검진 결과 파일 (PDF / 이미지)
        </label>
        <FilePicker name="files" transformOnAdd={maybeConvertLargePdfs} />
        <p className="mt-1 text-xs text-muted-foreground">
          여러 페이지 결과지면 모두 선택하세요. 3MB 이상 PDF는 페이지별 이미지로 자동
          변환되어 저장됩니다 (서버 업로드 한도 회피).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="검진일" required>
          <input
            type="date"
            name="date"
            required
            defaultValue={today}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="대상자" required>
          <SubjectSelect />
        </Field>
      </div>

      <Field label="제목" required>
        <input
          name="title"
          required
          placeholder="예: 2026 종합건강검진"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="병원/검진센터">
        <input
          name="hospitalName"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="요약">
        <textarea
          name="summary"
          rows={6}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="이상 소견 / 주의 항목">
        <textarea
          name="symptoms"
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="의사 소견">
        <textarea
          name="doctorOpinion"
          rows={3}
          placeholder="문서의 의사소견 + 직접 들은 추가 설명도 함께"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="추가 메모">
        <textarea
          name="notes"
          rows={3}
          placeholder="다음 검진 일정, 추적관찰 항목 등"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        저장
      </button>
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
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
