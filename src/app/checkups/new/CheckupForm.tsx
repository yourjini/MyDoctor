"use client";

import { useRef, useState } from "react";
import { FilePicker } from "@/components/FilePicker";
import { SubjectSelect } from "@/components/SubjectSelect";
import { uploadFileToBlob, type UploadedBlob } from "@/lib/blob-upload";
import { createCheckupAction } from "../actions";

export function CheckupForm({ initialDate }: { initialDate?: string } = {}) {
  const today = initialDate ?? new Date().toISOString().slice(0, 10);
  const formRef = useRef<HTMLFormElement>(null);
  const blobUrlsRef = useRef<HTMLInputElement>(null);
  const readyRef = useRef(false);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (readyRef.current) {
      readyRef.current = false;
      return; // Blob 업로드 끝나고 다시 들어온 submit — 액션 그냥 진행
    }
    e.preventDefault();
    if (uploading) return;

    setError(null);
    setUploading(true);
    setProgress(null);

    try {
      const blobs: UploadedBlob[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(
          `${i + 1}/${files.length} ${f.name} 업로드 중… (${formatBytes(f.size)})`,
        );
        const b = await uploadFileToBlob(f, (loaded, total) => {
          if (total) {
            const pct = Math.round((loaded / total) * 100);
            setProgress(
              `${i + 1}/${files.length} ${f.name} ${pct}%`,
            );
          }
        });
        blobs.push(b);
      }
      if (blobUrlsRef.current) {
        blobUrlsRef.current.value = JSON.stringify(blobs);
      }
      setProgress("저장 중…");
      readyRef.current = true;
      formRef.current?.requestSubmit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      setError(msg);
      setUploading(false);
      setProgress(null);
    }
  }

  return (
    <form
      ref={formRef}
      action={createCheckupAction}
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <input type="hidden" name="blob_urls" ref={blobUrlsRef} defaultValue="" />

      <div>
        <label className="mb-1 block text-sm font-medium">
          검진 결과 파일 (PDF / 이미지)
        </label>
        <FilePicker onChange={setFiles} disabled={uploading} />
        <p className="mt-1 text-xs text-muted-foreground">
          파일은 Blob 스토리지를 거쳐 업로드되어 GitHub에 저장됩니다 (4.5MB 한도 회피).
        </p>
      </div>

      {progress && (
        <p className="text-xs text-muted-foreground">{progress}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

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
        disabled={uploading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {uploading ? "업로드 중…" : "저장"}
      </button>
    </form>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
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
