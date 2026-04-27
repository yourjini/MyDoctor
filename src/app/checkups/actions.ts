"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCheckup,
  deleteCheckup,
  updateCheckup,
} from "@/lib/store";
import type { Checkup } from "@/lib/types";

export async function createCheckupAction(formData: FormData) {
  const date = String(formData.get("date") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const hospitalName = String(formData.get("hospitalName") || "").trim() || undefined;
  const summary = String(formData.get("summary") || "").trim();
  const symptoms = String(formData.get("symptoms") || "").trim() || undefined;
  const doctorOpinion =
    String(formData.get("doctorOpinion") || "").trim() || undefined;
  const notes = String(formData.get("notes") || "").trim() || undefined;

  if (!date || !title) throw new Error("검진일과 제목은 필수입니다");

  const files = formData.getAll("files") as File[];
  const fileBufs: { filename: string; contentType: string; data: Buffer }[] = [];
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    const data = Buffer.from(await f.arrayBuffer());
    fileBufs.push({
      filename: f.name,
      contentType: f.type || "application/octet-stream",
      data,
    });
  }

  const checkup = await createCheckup(
    {
      date,
      title,
      hospitalName,
      summary,
      symptoms,
      doctorOpinion,
      notes,
    },
    fileBufs,
  );
  revalidatePath("/checkups");
  redirect(`/checkups/${checkup.date.slice(0, 4)}/${checkup.id}`);
}

export async function updateCheckupAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  const patch: Partial<Checkup> = {
    date: String(formData.get("date") || ""),
    title: String(formData.get("title") || "").trim(),
    hospitalName: String(formData.get("hospitalName") || "").trim() || undefined,
    summary: String(formData.get("summary") || "").trim(),
    symptoms: String(formData.get("symptoms") || "").trim() || undefined,
    doctorOpinion:
      String(formData.get("doctorOpinion") || "").trim() || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined,
  };
  await updateCheckup(year, id, patch);
  revalidatePath(`/checkups/${year}/${id}`);
  revalidatePath("/checkups");
  redirect(`/checkups/${year}/${id}`);
}

export async function deleteCheckupAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  await deleteCheckup(year, id);
  revalidatePath("/checkups");
  redirect("/checkups");
}
