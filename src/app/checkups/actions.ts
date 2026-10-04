"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCheckup,
  deleteCheckup,
  removeCheckupAttachment,
  updateCheckup,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import { cleanupBlobs, collectUploadedFiles } from "@/lib/upload-helpers";
import type { Checkup } from "@/lib/types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function createCheckupAction(formData: FormData) {
  const date = String(formData.get("date") || "").trim();
  const subject = asPerson(formData.get("subject"));
  const title = String(formData.get("title") || "").trim();
  const hospitalName = String(formData.get("hospitalName") || "").trim() || undefined;
  const summary = String(formData.get("summary") || "").trim();
  const symptoms = String(formData.get("symptoms") || "").trim() || undefined;
  const doctorOpinion =
    String(formData.get("doctorOpinion") || "").trim() || undefined;
  const notes = String(formData.get("notes") || "").trim() || undefined;

  if (!date || !title) throw new Error("검진일과 제목은 필수입니다");
  if (!ISO_DATE_RE.test(date)) throw new Error("검진일 형식이 올바르지 않습니다 (YYYY-MM-DD)");

  const { files: fileBufs, blobUrlsToCleanup } = await collectUploadedFiles(
    formData,
  );

  await createCheckup(
    {
      date,
      subject,
      title,
      hospitalName,
      summary,
      symptoms,
      doctorOpinion,
      notes,
    },
    fileBufs,
  );
  await cleanupBlobs(blobUrlsToCleanup);
  revalidatePath("/checkups");
  redirect("/checkups");
}

export async function updateCheckupAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  const date = String(formData.get("date") || "");
  if (!ISO_DATE_RE.test(date)) throw new Error("검진일 형식이 올바르지 않습니다");
  const patch: Partial<Checkup> = {
    date,
    subject: asPerson(formData.get("subject")),
    title: String(formData.get("title") || "").trim(),
    hospitalName: String(formData.get("hospitalName") || "").trim() || undefined,
    summary: String(formData.get("summary") || "").trim(),
    symptoms: String(formData.get("symptoms") || "").trim() || undefined,
    doctorOpinion:
      String(formData.get("doctorOpinion") || "").trim() || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined,
  };

  const { files: fileBufs, blobUrlsToCleanup } = await collectUploadedFiles(
    formData,
  );

  await updateCheckup(year, id, patch, fileBufs);
  await cleanupBlobs(blobUrlsToCleanup);
  revalidatePath(`/checkups/${year}/${id}`);
  revalidatePath("/checkups");
  redirect(`/checkups/${year}/${id}`);
}

export async function deleteCheckupAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  await deleteCheckup(year, id);
  revalidatePath("/checkups");
  redirect("/checkups");
}

export async function removeCheckupAttachmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  const path = String(formData.get("path") || "");
  if (!id || !year || !path) throw new Error("id/year/path 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  // path traversal 방어: 정확한 prefix + 추가 ".." 금지
  const expectedPrefix = `data/checkups/${year}/${id}-files/`;
  if (!path.startsWith(expectedPrefix) || path.includes("..")) {
    throw new Error("invalid path");
  }
  await removeCheckupAttachment(year, id, path);
  revalidatePath(`/checkups/${year}/${id}`);
  redirect(`/checkups/${year}/${id}`);
}
