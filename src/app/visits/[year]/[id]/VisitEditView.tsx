"use client";

import { useState } from "react";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { SubjectSelect } from "@/components/SubjectSelect";
import { FilePicker } from "@/components/FilePicker";
import { AttachmentDeleteButton } from "@/components/AttachmentDeleteButton";
import { AttachmentGallery } from "@/components/AttachmentGallery";
import { useBlobUploadForm } from "@/lib/use-blob-form";
import {
  removeVisitAttachmentAction,
  updateVisitAction,
} from "../../actions";
import type { Visit } from "@/lib/types";

export function VisitEditView({
  visit,
  year,
}: {
  visit: Visit;
  year: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const blob = useBlobUploadForm(updateVisitAction);

  function cancel() {
    blob.formRef.current?.reset();
    blob.setFiles([]);
    setIsEditing(false);
  }

  return (
    <>
      <form
        ref={blob.formRef}
        onSubmit={blob.onSubmit}
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <input type="hidden" name="id" value={visit.id} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="blob_urls" ref={blob.blobUrlsRef} defaultValue="" />

        <fieldset disabled={!isEditing || blob.uploading} className="space-y-4 disabled:opacity-90">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="방문일">
              <input
                type="date"
                name="date"
                defaultValue={visit.date}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
              />
            </Field>
            <Field label="대상자">
              <SubjectSelect defaultValue={visit.subject} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="병원 유형">
              <HospitalTypeSelect defaultValue={visit.hospitalType} />
            </Field>
            <Field label="병원명">
              <input
                name="hospitalName"
                defaultValue={visit.hospitalName}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
              />
            </Field>
          </div>

          <Field label="의사 이름">
            <input
              name="doctorName"
              defaultValue={visit.doctorName ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="병명 / 진단">
            <input
              name="diagnosis"
              defaultValue={visit.diagnosis}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <Field label="상세 내용">
            <textarea
              name="details"
              rows={4}
              defaultValue={visit.details ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="insuranceClaimed"
              defaultChecked={visit.insuranceClaimed}
              className="h-4 w-4"
            />
            실비보험 청구 완료
          </label>

          <div className={isEditing ? "" : "hidden"}>
            <label className="mb-1 block text-sm font-medium">
              첨부파일 추가 (이미지 / PDF / 녹음)
            </label>
            <FilePicker
              onChange={blob.setFiles}
              disabled={blob.uploading}
              accept="image/*,application/pdf,audio/*"
            />
          </div>
        </fieldset>

        {blob.progress && (
          <p className="text-xs text-muted-foreground">{blob.progress}</p>
        )}
        {blob.error && <p className="text-sm text-destructive">{blob.error}</p>}

        <div className={isEditing ? "flex gap-2 pt-1" : "hidden"}>
          <button
            type="submit"
            disabled={blob.uploading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {blob.uploading ? "업로드 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={blob.uploading}
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

      {visit.attachments.length > 0 && (
        <section className="mt-6 rounded-lg border bg-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-medium">첨부파일</h3>
          <AttachmentGallery
            attachments={visit.attachments}
            itemAccessory={(a) => (
              <form
                action={removeVisitAttachmentAction}
                className={
                  isEditing ? "absolute -right-1.5 -top-1.5" : "hidden"
                }
              >
                <input type="hidden" name="id" value={visit.id} />
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
