"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createHealthLog,
  deleteHealthLog,
  updateHealthLog,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import type { HealthLog, MenstruationFlow } from "@/lib/types";

function parseTags(formData: FormData, name: string): string[] {
  // FilePicker pattern: comma-separated hidden field
  const raw = String(formData.get(name) || "").trim();
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

function parseSeverity(formData: FormData): number | undefined {
  const raw = String(formData.get("severity") || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 5) return undefined;
  return Math.round(n);
}

function parseMenstruation(formData: FormData): MenstruationFlow | undefined {
  const raw = String(formData.get("menstruation") || "").trim();
  if (raw === "light" || raw === "normal" || raw === "heavy") return raw;
  return undefined;
}

export async function createHealthLogAction(formData: FormData) {
  const date = String(formData.get("date") || "");
  const subject = asPerson(formData.get("subject"));
  const bodyTags = parseTags(formData, "bodyTags");
  const moodTags = parseTags(formData, "moodTags");
  const severity = parseSeverity(formData);
  const menstruation = parseMenstruation(formData);
  const note = String(formData.get("note") || "").trim() || undefined;

  if (!date) throw new Error("날짜는 필수입니다");
  if (bodyTags.length === 0 && moodTags.length === 0 && !note) {
    throw new Error("최소 한 가지 태그나 메모를 입력하세요");
  }

  await createHealthLog({
    date,
    subject,
    bodyTags,
    moodTags,
    severity,
    menstruation,
    note,
  });

  revalidatePath("/health");
  revalidatePath("/");
  redirect("/health");
}

export async function updateHealthLogAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");

  const patch: Partial<HealthLog> = {
    date: String(formData.get("date") || ""),
    subject: asPerson(formData.get("subject")),
    bodyTags: parseTags(formData, "bodyTags"),
    moodTags: parseTags(formData, "moodTags"),
    severity: parseSeverity(formData),
    menstruation: parseMenstruation(formData),
    note: String(formData.get("note") || "").trim() || undefined,
  };

  await updateHealthLog(year, id, patch);
  revalidatePath(`/health/${year}/${id}`);
  revalidatePath("/health");
  revalidatePath("/");
  redirect(`/health/${year}/${id}`);
}

export async function deleteHealthLogAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  await deleteHealthLog(year, id);
  revalidatePath("/health");
  revalidatePath("/");
  redirect("/health");
}
