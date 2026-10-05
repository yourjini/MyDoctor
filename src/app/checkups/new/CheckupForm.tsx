"use client";

import { FilePicker } from "@/components/FilePicker";
import { SubjectSelect } from "@/components/SubjectSelect";
import { useBlobUploadForm } from "@/lib/use-blob-form";
import { createCheckupAction } from "../actions";

export function CheckupForm({ initialDate }: { initialDate?: string } = {}) {
  const today = initialDate ?? new Date().toISOString().slice(0, 10);
  const blob = useBlobUploadForm(createCheckupAction);

  return (
    <form
      ref={blob.formRef}
      onSubmit={blob.onSubmit}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <input type="hidden" name="blob_urls" ref={blob.blobUrlsRef} defaultValue="" />

      <div>
        <label className="mb-1 block text-sm font-medium">
          검진 결과 파일 (PDF / 이미지 / 녹음)
        </label>
        <FilePicker
          onChange={blob.setFiles}
          disabled={blob.uploading}
          accept="image/*,application/pdf,audio/*"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          파일은 Blob 스토리지를 거쳐 업로드되어 GitHub에 저장됩니다 (4.5MB 한도 회피).
        </p>
      </div>

      {blob.progress && (
        <p className="text-xs text-muted-foreground">{blob.progress}</p>
      )}
      {blob.error && <p className="text-sm text-destructive">{blob.error}</p>}

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
        disabled={blob.uploading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {blob.uploading ? "업로드 중…" : "저장"}
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
