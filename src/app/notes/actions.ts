"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asPerson } from "@/lib/people";
import {
  createClinicNote,
  deleteClinicNote,
  getClinicNote,
  updateClinicNote,
} from "@/lib/store";
import type { ClinicNote, ClinicNoteStatus } from "@/lib/types";

function parseTags(formData: FormData): string[] {
  const raw = String(formData.get("tags") || "").trim();
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

function parseStatus(formData: FormData): ClinicNoteStatus {
  const raw = String(formData.get("status") || "").trim();
  return raw === "done" ? "done" : "pending";
}

export async function createClinicNoteAction(formData: FormData) {
  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("내용은 필수입니다");

  const subject = asPerson(formData.get("subject"));
  const title = String(formData.get("title") || "").trim() || undefined;
  const hospitalType =
    String(formData.get("hospitalType") || "").trim() || undefined;
  const tags = parseTags(formData);
  const status = parseStatus(formData);

  await createClinicNote({
    subject,
    title,
    hospitalType,
    body,
    tags: tags.length > 0 ? tags : undefined,
    status,
    doneAt: status === "done" ? new Date().toISOString() : undefined,
  });

  revalidatePath("/notes");
  redirect("/notes");
}

export async function updateClinicNoteAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");

  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("내용은 필수입니다");

  const current = await getClinicNote(id);
  const tags = parseTags(formData);
  const status = parseStatus(formData);

  const patch: Partial<ClinicNote> = {
    subject: asPerson(formData.get("subject")),
    title: String(formData.get("title") || "").trim() || undefined,
    hospitalType:
      String(formData.get("hospitalType") || "").trim() || undefined,
    body,
    tags: tags.length > 0 ? tags : undefined,
    status,
    doneAt:
      status === "done"
        ? current?.doneAt ?? new Date().toISOString()
        : undefined,
  };

  await updateClinicNote(id, patch);
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  redirect("/notes");
}

// 목록에서 한 번에 상태 토글 — 별도 페이지 진입 없이 체크.
export async function toggleClinicNoteAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");

  const current = await getClinicNote(id);
  if (!current) return;

  const nextStatus: ClinicNoteStatus =
    current.status === "done" ? "pending" : "done";
  await updateClinicNote(id, {
    status: nextStatus,
    doneAt: nextStatus === "done" ? new Date().toISOString() : undefined,
  });

  revalidatePath("/notes");
}

export async function deleteClinicNoteAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");
  await deleteClinicNote(id);
  revalidatePath("/notes");
  redirect("/notes");
}
