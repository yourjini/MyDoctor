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

function parseMoodScale(formData: FormData): number | undefined {
  const raw = String(formData.get("moodScale") || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < -5 || n > 5) return undefined;
  return Math.round(n);
}

function parseSleepHours(formData: FormData): number | undefined {
  const raw = String(formData.get("sleepHours") || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 24) return undefined;
  return Math.round(n * 2) / 2; // 0.5 단위
}

export async function createHealthLogAction(formData: FormData) {
  const date = String(formData.get("date") || "");
  const subject = asPerson(formData.get("subject"));
  const bodyTags = parseTags(formData, "bodyTags");
  const moodTagsBase = parseTags(formData, "moodTags");
  const manicTags = parseTags(formData, "manicTags");
  const moodTags = Array.from(new Set([...moodTagsBase, ...manicTags]));
  const severity = parseSeverity(formData);
  const menstruation = parseMenstruation(formData);
  const note = String(formData.get("note") || "").trim() || undefined;

  if (!date) throw new Error("날짜는 필수입니다");
  if (bodyTags.length === 0 && moodTags.length === 0 && !note) {
    throw new Error("최소 한 가지 태그나 메모를 입력하세요");
  }

  // 박란하만 moodScale/sleepHours 적용
  const isBipolarSubject = subject === "박란하";
  const moodScale = isBipolarSubject ? parseMoodScale(formData) : undefined;
  const sleepHours = isBipolarSubject ? parseSleepHours(formData) : undefined;

  await createHealthLog({
    date,
    subject,
    bodyTags,
    moodTags,
    severity,
    menstruation,
    note,
    moodScale,
    sleepHours,
  });

  revalidatePath("/health");
  revalidatePath("/");
  redirect("/health");
}

export async function updateHealthLogAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");

  const subject = asPerson(formData.get("subject"));
  const isBipolarSubject = subject === "박란하";

  const moodTagsBase = parseTags(formData, "moodTags");
  const manicTags = parseTags(formData, "manicTags");
  const moodTags = Array.from(new Set([...moodTagsBase, ...manicTags]));

  const patch: Partial<HealthLog> = {
    date: String(formData.get("date") || ""),
    subject,
    bodyTags: parseTags(formData, "bodyTags"),
    moodTags,
    severity: parseSeverity(formData),
    menstruation: parseMenstruation(formData),
    note: String(formData.get("note") || "").trim() || undefined,
    moodScale: isBipolarSubject ? parseMoodScale(formData) : undefined,
    sleepHours: isBipolarSubject ? parseSleepHours(formData) : undefined,
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
