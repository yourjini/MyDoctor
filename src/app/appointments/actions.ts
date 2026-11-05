"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAppointment,
  createVisit,
  deleteAppointment,
  getAppointment,
  updateAppointment,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import type { Appointment } from "@/lib/types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseTime(raw: string, fallback: string): string {
  return HHMM_RE.test(raw) ? raw : fallback;
}

export async function createAppointmentAction(formData: FormData) {
  const date = String(formData.get("date") || "");
  const time = parseTime(String(formData.get("time") || ""), "09:00");
  const datetime = `${date}T${time}:00`;
  const subject = asPerson(formData.get("subject"));
  const hospitalName = String(formData.get("hospitalName") || "").trim();
  const hospitalType = String(formData.get("hospitalType") || "") || undefined;
  const doctorName = String(formData.get("doctorName") || "").trim() || undefined;
  const reason = String(formData.get("reason") || "").trim() || undefined;
  const precautions =
    String(formData.get("precautions") || "").trim() || undefined;

  if (!date || !hospitalName) throw new Error("날짜와 병원명은 필수입니다");
  if (!ISO_DATE_RE.test(date)) throw new Error("예약일 형식이 올바르지 않습니다");

  const appt = await createAppointment({
    datetime,
    subject,
    hospitalName,
    hospitalType,
    doctorName,
    reason,
    precautions,
  });

  revalidatePath("/appointments");
  revalidatePath("/");
  redirect("/appointments?saved=1");
}

export async function updateAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  const date = String(formData.get("date") || "");
  if (!ISO_DATE_RE.test(date)) throw new Error("예약일 형식이 올바르지 않습니다");
  const time = parseTime(String(formData.get("time") || ""), "09:00");
  const patch: Partial<Appointment> = {
    datetime: `${date}T${time}:00`,
    subject: asPerson(formData.get("subject")),
    hospitalName: String(formData.get("hospitalName") || "").trim(),
    hospitalType: String(formData.get("hospitalType") || "") || undefined,
    doctorName: String(formData.get("doctorName") || "").trim() || undefined,
    reason: String(formData.get("reason") || "").trim() || undefined,
    precautions: String(formData.get("precautions") || "").trim() || undefined,
  };
  await updateAppointment(year, id, patch);
  revalidatePath(`/appointments/${year}/${id}`);
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect(`/appointments/${year}/${id}?saved=1`);
}

// 예약 "방문완료" 처리 — Visit 를 자동 생성하고 appointmentId 로 연결,
// Appointment.status 를 "completed" 로 업데이트. 캘린더에서는 visit 만 노출.
export async function completeAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");

  const appt = await getAppointment(year, id);
  if (!appt) throw new Error("예약을 찾을 수 없습니다");

  const diagnosis =
    String(formData.get("diagnosis") || "").trim() ||
    appt.reason ||
    "진료 완료";
  const details = String(formData.get("details") || "").trim() || undefined;
  const now = new Date().toISOString();

  // 과거/오늘 예약이면 그 날짜, 미래이면 오늘 (실제 방문일 기준).
  const apptDate = appt.datetime.slice(0, 10);
  const today = now.slice(0, 10);
  const visitDate = apptDate <= today ? apptDate : today;

  const visit = await createVisit(
    {
      date: visitDate,
      subject: appt.subject,
      hospitalType: String(appt.hospitalType || "내과"),
      hospitalName: appt.hospitalName,
      doctorName: appt.doctorName,
      diagnosis,
      details,
      insuranceClaimed: false,
      appointmentId: appt.id,
    },
    [],
  );

  await updateAppointment(year, id, {
    status: "completed",
    completedAt: now,
  });

  revalidatePath(`/appointments/${year}/${id}`);
  revalidatePath("/appointments");
  revalidatePath("/visits");
  revalidatePath("/");
  redirect(`/visits/${visit.date.slice(0, 4)}/${visit.id}?saved=completed`);
}

// 예약 "비방문" 처리 — Appointment.status="missed" 로 바꾸고 레코드는 보존.
// 캘린더/다가오는 예약에서 제외.
export async function missAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");

  await updateAppointment(year, id, { status: "missed" });

  revalidatePath(`/appointments/${year}/${id}`);
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect(`/appointments/${year}/${id}?saved=missed`);
}

// 상태 되돌리기 — 실수로 completed/missed 로 바꿨을 때. (completed 로
// 바뀌었던 거라면 생성된 Visit 는 사용자가 수동으로 지워야 함 — 자동
// 되돌림 안 함, 안전상.)
export async function reopenAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");

  await updateAppointment(year, id, {
    status: "scheduled",
    completedAt: undefined,
  });

  revalidatePath(`/appointments/${year}/${id}`);
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect(`/appointments/${year}/${id}?saved=reopened`);
}

export async function deleteAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  await deleteAppointment(year, id);
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect("/appointments?saved=deleted");
}
