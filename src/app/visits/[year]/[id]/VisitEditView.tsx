"use client";

import { useRef, useState } from "react";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { FilePicker } from "@/components/FilePicker";
import { AttachmentDeleteButton } from "@/components/AttachmentDeleteButton";
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
  const formRef = useRef<HTMLFormElement>(null);

  function cancel() {
    formRef.current?.reset();
    setIsEditing(false);
  }

  return (
    <>
      <form
        ref={formRef}
        action={updateVisitAction}
        encType="multipart/form-data"
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <input type="hidden" name="id" value={visit.id} />
        <input type="hidden" name="year" value={year} />

        <fieldset disabled={!isEditing} className="space-y-4 disabled:opacity-90">
          <Field label="방문일">
            <input
              type="date"
              name="date"
              defaultValue={visit.date}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>

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
              첨부파일 추가
            </label>
            <FilePicker name="files" />
          </div>
        </fieldset>

        <div className={isEditing ? "flex gap-2 pt-1" : "hidden"}>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            저장
          </button>
          <button
            type="button"
            onClick={cancel}
            className="rounded-md border bg-background px-4 py-2 text-sm hover:bg-accent"
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
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visit.attachments.map((a) => (
              <li key={a.path} className="relative rounded-md border p-2">
                <a
                  href={`/api/file/${a.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {a.contentType.startsWith("image/") ? (
                    <img
                      src={`/api/file/${a.path}`}
                      alt={a.filename}
                      className="h-32 w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded bg-muted text-3xl">
                      📄
                    </div>
                  )}
                  <div className="mt-1 truncate text-xs">{a.filename}</div>
                </a>
                <form
                  action={removeVisitAttachmentAction}
                  className={
                    isEditing
                      ? "absolute -right-1.5 -top-1.5"
                      : "hidden"
                  }
                >
                  <input type="hidden" name="id" value={visit.id} />
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="path" value={a.path} />
                  <AttachmentDeleteButton filename={a.filename} />
                </form>
              </li>
            ))}
          </ul>
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
