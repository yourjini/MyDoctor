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
import type { Visit } from "@/lib/types";

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

  const files = formData.getAll("files") as File[];
  const fileBufs: { filename: string; contentType: string; data: Buffer }[] = [];
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    fileBufs.push({
      filename: f.name,
      contentType: f.type || "application/octet-stream",
      data: buf,
    });
  }

  const visit = await createVisit(
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

  revalidatePath("/visits");
  revalidatePath("/");
  redirect("/visits");
}

export async function updateVisitAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");

  const patch: Partial<Visit> = {
    date: String(formData.get("date") || ""),
    subject: asPerson(formData.get("subject")),
    hospitalType: String(formData.get("hospitalType") || ""),
    hospitalName: String(formData.get("hospitalName") || "").trim(),
    doctorName: String(formData.get("doctorName") || "").trim() || undefined,
    diagnosis: String(formData.get("diagnosis") || "").trim(),
    details: String(formData.get("details") || "").trim() || undefined,
    insuranceClaimed: formData.get("insuranceClaimed") === "on",
  };

  const files = formData.getAll("files") as File[];
  const fileBufs: { filename: string; contentType: string; data: Buffer }[] = [];
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    fileBufs.push({
      filename: f.name,
      contentType: f.type || "application/octet-stream",
      data: buf,
    });
  }

  await updateVisit(year, id, patch, fileBufs);
  revalidatePath(`/visits/${year}/${id}`);
  revalidatePath("/visits");
  revalidatePath("/");
  redirect(`/visits/${year}/${id}`);
}

export async function deleteVisitAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
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
  if (!path.startsWith(`data/visits/${year}/${id}-files/`)) {
    throw new Error("invalid path");
  }
  await removeVisitAttachment(year, id, path);
  revalidatePath(`/visits/${year}/${id}`);
  redirect(`/visits/${year}/${id}`);
}
