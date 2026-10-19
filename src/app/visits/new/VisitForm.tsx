"use client";

import { useRef } from "react";
import { AppointmentSelect } from "@/components/AppointmentSelect";
import { FilePicker } from "@/components/FilePicker";
import { PEOPLE, DEFAULT_PERSON } from "@/lib/people";
import { useBlobUploadForm } from "@/lib/use-blob-form";
import type { Appointment } from "@/lib/types";
import { createVisitAction } from "../actions";

const HOSPITAL_TYPES = [
  "내과",
  "외과",
  "산부인과",
  "정형외과",
  "피부과",
  "안과",
  "이비인후과",
  "치과",
  "정신건강의학과",
  "비뇨기과",
  "유방외과",
  "흉부외과",
  "한의원",
  "기타",
];

export function VisitForm({
  initialDate,
  appointments,
  initialAppointmentId,
}: {
  initialDate?: string;
  appointments: Appointment[];
  initialAppointmentId?: string;
}) {
  const today = initialDate ?? new Date().toISOString().slice(0, 10);
  const blob = useBlobUploadForm(createVisitAction);

  const dateRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLSelectElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const doctorRef = useRef<HTMLInputElement>(null);

  // 예약 선택 시 폼의 날짜·대상자·병원 유형·병원명·의사를 자동 채움.
  function handleApptPick(a: Appointment | null) {
    if (!a) return;
    if (dateRef.current) dateRef.current.value = a.datetime.slice(0, 10);
    if (subjectRef.current && a.subject) subjectRef.current.value = a.subject;
    if (typeRef.current && a.hospitalType)
      typeRef.current.value = a.hospitalType;
    if (nameRef.current) nameRef.current.value = a.hospitalName;
    if (doctorRef.current && a.doctorName)
      doctorRef.current.value = a.doctorName;
  }

  return (
    <form
      ref={blob.formRef}
      onSubmit={blob.onSubmit}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <input type="hidden" name="blob_urls" ref={blob.blobUrlsRef} defaultValue="" />

      {appointments.length > 0 && (
        <div className="rounded-md border border-dashed bg-muted/30 p-3">
          <label className="mb-1 block text-sm font-medium">
            연결된 예약 (선택)
          </label>
          <AppointmentSelect
            appointments={appointments}
            defaultValue={initialAppointmentId ?? ""}
            onPick={handleApptPick}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            선택하면 예약 내용으로 아래 필드가 자동 채워집니다. 저장 후
            캘린더에서 해당 예약은 숨겨져요.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="방문일" required>
          <input
            type="date"
            name="date"
            ref={dateRef}
            defaultValue={today}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="대상자" required>
          <select
            name="subject"
            ref={subjectRef}
            defaultValue={DEFAULT_PERSON}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {PEOPLE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="병원 유형" required>
          <select
            name="hospitalType"
            ref={typeRef}
            defaultValue="내과"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {HOSPITAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="병원명" required>
          <input
            name="hospitalName"
            ref={nameRef}
            required
            placeholder="○○병원"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="의사 이름 (선택)">
        <input
          name="doctorName"
          ref={doctorRef}
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
