"use client";

import { useRef, useState } from "react";
import { HospitalTypeSelect } from "@/components/HospitalTypeSelect";
import { updateAppointmentAction } from "../../actions";
import type { Appointment } from "@/lib/types";

export function AppointmentEditView({
  appt,
  year,
}: {
  appt: Appointment;
  year: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const date = appt.datetime.slice(0, 10);
  const time = appt.datetime.slice(11, 16);

  function cancel() {
    formRef.current?.reset();
    setIsEditing(false);
  }

  return (
    <form
      ref={formRef}
      action={updateAppointmentAction}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <input type="hidden" name="id" value={appt.id} />
      <input type="hidden" name="year" value={year} />

      <fieldset disabled={!isEditing} className="space-y-4 disabled:opacity-90">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="날짜">
            <input
              type="date"
              name="date"
              defaultValue={date}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>
          <Field label="시간">
            <input
              type="time"
              name="time"
              defaultValue={time}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="병원 유형">
            <HospitalTypeSelect defaultValue={appt.hospitalType} />
          </Field>
          <Field label="병원명">
            <input
              name="hospitalName"
              defaultValue={appt.hospitalName}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
            />
          </Field>
        </div>

        <Field label="의사 이름">
          <input
            name="doctorName"
            defaultValue={appt.doctorName ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
          />
        </Field>

        <Field label="진료 목적">
          <input
            name="reason"
            defaultValue={appt.reason ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
          />
        </Field>

        <Field label="주의사항">
          <textarea
            name="precautions"
            rows={3}
            defaultValue={appt.precautions ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
          />
        </Field>
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
