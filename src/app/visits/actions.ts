"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createVisit,
  deleteVisit,
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
    },
    fileBufs,
  );
  await cleanupBlobs(blobUrlsToCleanup);

  revalidatePath("/visits");
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
  };

  const { files: fileBufs, blobUrlsToCleanup } = await collectUploadedFiles(
    formData,
  );

  await updateVisit(year, id, patch, fileBufs);
  await cleanupBlobs(blobUrlsToCleanup);
  revalidatePath(`/visits/${year}/${id}`);
  revalidatePath("/visits");
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
