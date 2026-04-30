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

export async function createAppointmentAction(formData: FormData) {
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "09:00");
  const datetime = `${date}T${time}:00`;
  const subject = asPerson(formData.get("subject"));
  const hospitalName = String(formData.get("hospitalName") || "").trim();
  const hospitalType = String(formData.get("hospitalType") || "") || undefined;
  const doctorName = String(formData.get("doctorName") || "").trim() || undefined;
  const reason = String(formData.get("reason") || "").trim() || undefined;
  const precautions =
    String(formData.get("precautions") || "").trim() || undefined;

  if (!date || !hospitalName) throw new Error("날짜와 병원명은 필수입니다");

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
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "09:00");
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
  await deleteAppointment(year, id);
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect("/appointments");
}
