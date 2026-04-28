"use client";

import { useRef, useState } from "react";
import { createCheckupAction } from "../actions";

type Extracted = {
  date: string;
  title: string;
  hospitalName: string;
  summary: string;
  symptoms: string;
  doctorOpinion: string;
};

export function CheckupForm({ initialDate }: { initialDate?: string } = {}) {
  const today = initialDate ?? new Date().toISOString().slice(0, 10);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleExtract() {
    if (files.length === 0) {
      setExtractError("먼저 PDF 또는 이미지를 선택해주세요");
      return;
    }
    setExtracting(true);
    setExtractError(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const res = await fetch("/api/checkups/extract", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `${res.status}`);
      }
      const data = (await res.json()) as Extracted;
      setExtracted(data);
    } catch (err: unknown) {
      setExtractError(err instanceof Error ? err.message : "추출 실패");
    } finally {
      setExtracting(false);
    }
  }

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
        <input
          type="file"
          name="files"
          multiple
          accept="image/*,application/pdf"
          onChange={(e) => {
            setFiles(Array.from(e.target.files ?? []));
            setExtracted(null);
          }}
          className="block text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          여러 페이지 결과지면 모두 선택하세요. 업로드한 원본 파일은 검진
          기록과 함께 저장됩니다.
        </p>
      </div>

      <div className="rounded-md border border-dashed bg-accent/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="font-medium">AI 자동 요약</div>
            <div className="text-xs text-muted-foreground">
              파일을 분석해 검진일, 병원, 요약, 이상 소견을 자동으로 채웁니다.
            </div>
          </div>
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting || files.length === 0}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {extracting ? "분석 중..." : "AI 분석"}
          </button>
        </div>
        {extractError && (
          <p className="mt-2 text-sm text-destructive">{extractError}</p>
        )}
        {extracted && (
          <p className="mt-2 text-xs text-emerald-700">
            ✓ 분석 완료 — 아래 항목이 채워졌습니다. 자유롭게 수정하세요.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="검진일" required>
          <input
            type="date"
            name="date"
            required
            defaultValue={extracted?.date || today}
            key={`date-${extracted?.date ?? ""}`}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="제목" required>
          <input
            name="title"
            required
            placeholder="예: 2026 종합건강검진"
            defaultValue={extracted?.title || ""}
            key={`title-${extracted?.title ?? ""}`}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="병원/검진센터">
        <input
          name="hospitalName"
          defaultValue={extracted?.hospitalName || ""}
          key={`hosp-${extracted?.hospitalName ?? ""}`}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="요약">
        <textarea
          name="summary"
          rows={6}
          defaultValue={extracted?.summary || ""}
          key={`sum-${extracted?.summary ?? ""}`}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="이상 소견 / 주의 항목">
        <textarea
          name="symptoms"
          rows={4}
          defaultValue={extracted?.symptoms || ""}
          key={`sym-${extracted?.symptoms ?? ""}`}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="의사 소견">
        <textarea
          name="doctorOpinion"
          rows={3}
          defaultValue={extracted?.doctorOpinion || ""}
          key={`opi-${extracted?.doctorOpinion ?? ""}`}
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
