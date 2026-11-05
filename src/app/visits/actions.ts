"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAppointment,
  createVisit,
  deleteVisit,
  getVisit,
  removeVisitAttachment,
  updateVisit,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import { cleanupBlobs, collectUploadedFiles } from "@/lib/upload-helpers";
import type { Visit } from "@/lib/types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function createVisitAction(formData: FormData) {
  const date = String(formData.get("date") || "");
  const subject = asPerson(formData.get("subject"));
  const hospitalType = String(formData.get("hospitalType") || "내과");
  const hospitalName = String(formData.get("hospitalName") || "").trim();
  const doctorName = String(formData.get("doctorName") || "").trim() || undefined;
  const diagnosis = String(formData.get("diagnosis") || "").trim();
  const details = String(formData.get("details") || "").trim() || undefined;
  const insuranceClaimed = formData.get("insuranceClaimed") === "on";
  const appointmentId =
    String(formData.get("appointmentId") || "").trim() || undefined;

  if (!date || !hospitalName || !diagnosis) {
    throw new Error("날짜, 병원명, 병명은 필수입니다");
  }
  if (!ISO_DATE_RE.test(date)) {
    throw new Error("방문일 형식이 올바르지 않습니다 (YYYY-MM-DD)");
  }

  const { files: fileBufs, blobUrlsToCleanup } = await collectUploadedFiles(
    formData,
  );

  await createVisit(
    {
      date,
      subject,
      hospitalType,
      hospitalName,
      doctorName,
      diagnosis,
      details,
      insuranceClaimed,
      appointmentId,
    },
    fileBufs,
  );
  await cleanupBlobs(blobUrlsToCleanup);

  revalidatePath("/visits");
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect("/visits");
}

export async function updateVisitAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  const date = String(formData.get("date") || "");
  if (!ISO_DATE_RE.test(date)) throw new Error("방문일 형식이 올바르지 않습니다");

  const patch: Partial<Visit> = {
    date,
    subject: asPerson(formData.get("subject")),
    hospitalType: String(formData.get("hospitalType") || ""),
    hospitalName: String(formData.get("hospitalName") || "").trim(),
    doctorName: String(formData.get("doctorName") || "").trim() || undefined,
    diagnosis: String(formData.get("diagnosis") || "").trim(),
    details: String(formData.get("details") || "").trim() || undefined,
    insuranceClaimed: formData.get("insuranceClaimed") === "on",
    appointmentId:
      String(formData.get("appointmentId") || "").trim() || undefined,
  };

  const { files: fileBufs, blobUrlsToCleanup } = await collectUploadedFiles(
    formData,
  );

  await updateVisit(year, id, patch, fileBufs);
  await cleanupBlobs(blobUrlsToCleanup);
  revalidatePath(`/visits/${year}/${id}`);
  revalidatePath("/visits");
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect(`/visits/${year}/${id}`);
}

export async function deleteVisitAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  await deleteVisit(year, id);
  revalidatePath("/visits");
  revalidatePath("/");
  redirect("/visits");
}

export async function removeVisitAttachmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  const path = String(formData.get("path") || "");
  if (!id || !year || !path) throw new Error("id/year/path 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  const expectedPrefix = `data/visits/${year}/${id}-files/`;
  if (!path.startsWith(expectedPrefix) || path.includes("..")) {
    throw new Error("invalid path");
  }
  await removeVisitAttachment(year, id, path);
  revalidatePath(`/visits/${year}/${id}`);
  redirect(`/visits/${year}/${id}`);
}

// 방문이력 → 예약 전환. 미래 날짜인데 실수로 방문이력으로 저장한 경우.
// Visit 정보를 Appointment 로 복사하고 원본 Visit 삭제. 첨부파일도 함께
// 삭제되므로 (Appointment 는 첨부 미지원), 사용자가 상세에서 "첨부 N개
// 사라집니다" 확인 후 호출.
export async function convertVisitToAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");

  const visit = await getVisit(year, id);
  if (!visit) throw new Error("방문이력을 찾을 수 없습니다");

  // diagnosis + details 를 Appointment.reason / precautions 에 매핑.
  // 사용자는 Appointment 상세에서 수정 가능.
  const reason = visit.diagnosis || undefined;
  const precautions = visit.details || undefined;
  // 시간은 모름 → 오전 09:00 기본값. 사용자가 상세에서 바꿀 수 있음.
  const datetime = `${visit.date}T09:00:00`;

  const appt = await createAppointment({
    datetime,
    subject: visit.subject,
    hospitalName: visit.hospitalName,
    hospitalType: visit.hospitalType,
    doctorName: visit.doctorName,
    reason,
    precautions,
  });

  // 원본 Visit (+ 첨부파일) 삭제
  await deleteVisit(year, id);

  revalidatePath("/visits");
  revalidatePath("/appointments");
  revalidatePath("/");
  redirect(`/appointments/${appt.datetime.slice(0, 4)}/${appt.id}`);
}
