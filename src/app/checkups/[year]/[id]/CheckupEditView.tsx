"use client";

import { useRef, useState } from "react";
import { FilePicker } from "@/components/FilePicker";
import { AttachmentDeleteButton } from "@/components/AttachmentDeleteButton";
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

  function cancel() {
    formRef.current?.reset();
    setIsEditing(false);
  }

  return (
    <>
      <form
        ref={formRef}
        action={updateCheckupAction}
        encType="multipart/form-data"
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      >
        <input type="hidden" name="id" value={checkup.id} />
        <input type="hidden" name="year" value={year} />

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
            <Field label="제목">
              <input
                name="title"
                defaultValue={checkup.title}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
              />
            </Field>
          </div>

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
            <FilePicker name="files" />
          </div>
        </fieldset>

        <div className="flex gap-2 pt-1">
          {isEditing ? (
            <>
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
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              수정하기
            </button>
          )}
        </div>
      </form>

      {checkup.attachments.length > 0 && (
        <section className="mt-6 rounded-lg border bg-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-medium">원본 파일</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {checkup.attachments.map((a) => (
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
                {isEditing && (
                  <form
                    action={removeCheckupAttachmentAction}
                    className="absolute -right-1.5 -top-1.5"
                  >
                    <input type="hidden" name="id" value={checkup.id} />
                    <input type="hidden" name="year" value={year} />
                    <input type="hidden" name="path" value={a.path} />
                    <AttachmentDeleteButton filename={a.filename} />
                  </form>
                )}
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
