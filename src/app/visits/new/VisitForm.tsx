"use client";

import { FilePicker } from "@/components/FilePicker";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { SubjectSelect } from "@/components/SubjectSelect";
import { useBlobUploadForm } from "@/lib/use-blob-form";
import { createVisitAction } from "../actions";

export function VisitForm({ initialDate }: { initialDate?: string } = {}) {
  const today = initialDate ?? new Date().toISOString().slice(0, 10);
  const blob = useBlobUploadForm(createVisitAction);

  return (
    <form
      ref={blob.formRef}
      onSubmit={blob.onSubmit}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <input type="hidden" name="blob_urls" ref={blob.blobUrlsRef} defaultValue="" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="방문일" required>
          <input
            type="date"
            name="date"
            defaultValue={today}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="대상자" required>
          <SubjectSelect />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="병원 유형" required>
          <HospitalTypeSelect />
        </Field>
        <Field label="병원명" required>
          <input
            name="hospitalName"
            required
            placeholder="○○병원"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="의사 이름 (선택)">
        <input
          name="doctorName"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="병명 / 진단" required>
        <input
          name="diagnosis"
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="상세 내용">
        <textarea
          name="details"
          rows={4}
          placeholder="처방, 검사 결과, 다음 진료 안내 등"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <div>
        <label className="mb-1 block text-sm font-medium">
          첨부파일 (영수증, 세부내역서, 처방전, 녹음)
        </label>
        <FilePicker
          onChange={blob.setFiles}
          disabled={blob.uploading}
          accept="image/*,application/pdf,audio/*"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Blob 스토리지를 거쳐 저장되므로 큰 PDF/녹음파일도 올릴 수 있습니다.
        </p>
      </div>

      {blob.progress && (
        <p className="text-xs text-muted-foreground">{blob.progress}</p>
      )}
      {blob.error && <p className="text-sm text-destructive">{blob.error}</p>}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="insuranceClaimed" className="h-4 w-4" />
        실비보험 청구 완료
      </label>

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
