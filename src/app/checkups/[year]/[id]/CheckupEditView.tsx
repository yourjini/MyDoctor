"use client";

import { useRef, useState } from "react";
import { FilePicker } from "@/components/FilePicker";
import { SubjectSelect } from "@/components/SubjectSelect";
import { AttachmentDeleteButton } from "@/components/AttachmentDeleteButton";
import { AttachmentGallery } from "@/components/AttachmentGallery";
import { uploadFileToBlob, type UploadedBlob } from "@/lib/blob-upload";
import {
  removeCheckupAttachmentAction,
  updateCheckupAction,
} from "../../actions";
import type { Checkup } from "@/lib/types";

export function CheckupEditView({
  checkup,
  year,
}: {
  checkup: Checkup;
  year: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const blobUrlsRef = useRef<HTMLInputElement>(null);
  const readyRef = useRef(false);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    formRef.current?.reset();
    setIsEditing(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (readyRef.current) {
      readyRef.current = false;
      return;
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
          `${i + 1}/${files.length} ${f.name} 업로드 중…`,
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
    <>
      <form
        ref={formRef}
        action={updateCheckupAction}
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <input type="hidden" name="id" value={checkup.id} />
        <input type="hidden" name="year" value={year} />
        <input
          type="hidden"
          name="blob_urls"
          ref={blobUrlsRef}
          defaultValue=""
        />

        <fieldset disabled={!isEditing} className="space-y-4 disabled:opacity-90">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="검진일">
              <input
                type="date"
                name="date"
                defaultValue={checkup.date}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
              />
            </Field>
            <Field label="대상자">
              <SubjectSelect defaultValue={checkup.subject} />
            </Field>
          </div>

          <Field label="제목">
            <input
              name="title"
              defaultValue={checkup.title}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="병원/검진센터">
            <input
              name="hospitalName"
              defaultValue={checkup.hospitalName ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="요약">
            <textarea
              name="summary"
              rows={6}
              defaultValue={checkup.summary}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="이상 소견 / 주의 항목">
            <textarea
              name="symptoms"
              rows={4}
              defaultValue={checkup.symptoms ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="의사 소견">
            <textarea
              name="doctorOpinion"
              rows={3}
              defaultValue={checkup.doctorOpinion ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="추가 메모">
            <textarea
              name="notes"
              rows={3}
              defaultValue={checkup.notes ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <div className={isEditing ? "" : "hidden"}>
            <label className="mb-1 block text-sm font-medium">
              원본 파일 추가
            </label>
            <FilePicker onChange={setFiles} disabled={uploading} />
            <p className="mt-1 text-xs text-muted-foreground">
              파일은 Blob 스토리지를 거쳐 업로드됩니다.
            </p>
            {progress && (
              <p className="mt-1 text-xs text-muted-foreground">{progress}</p>
            )}
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          </div>
        </fieldset>

        <div className={isEditing ? "flex gap-2 pt-1" : "hidden"}>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? "업로드 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={uploading}
            className="rounded-md border bg-background px-4 py-2 text-sm hover:bg-accent disabled:opacity-60"
          >
            취소
          </button>
        </div>
      </form>

      <div className={isEditing ? "hidden" : "pt-3"}>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          수정하기
        </button>
      </div>

      {checkup.attachments.length > 0 && (
        <section className="mt-6 rounded-lg border bg-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-medium">원본 파일</h3>
          <AttachmentGallery
            attachments={checkup.attachments}
            itemAccessory={(a) => (
              <form
                action={removeCheckupAttachmentAction}
                className={
                  isEditing ? "absolute -right-1.5 -top-1.5" : "hidden"
                }
              >
                <input type="hidden" name="id" value={checkup.id} />
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="path" value={a.path} />
                <AttachmentDeleteButton filename={a.filename} />
              </form>
            )}
          />
        </section>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
