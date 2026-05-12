"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAppointment,
  deleteAppointment,
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
  redirect("/appointments");
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
  redirect(`/appointments/${year}/${id}`);
}

export async function deleteAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  await deleteAppointment(year, id);
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect("/appointments");
}
