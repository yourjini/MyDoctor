"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createDiaryEntry,
  deleteDiaryEntry,
  updateDiaryEntry,
} from "@/lib/store";
import { DIARY_COOKIE, verifyDiaryToken } from "@/lib/auth";
import type { DiaryEntry } from "@/lib/types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function requireDiaryAuth() {
  const jar = await cookies();
  const token = jar.get(DIARY_COOKIE)?.value;
  if (!(await verifyDiaryToken(token))) {
    throw new Error("다이어리 잠금 해제가 필요합니다");
  }
}

function parseMood(formData: FormData): number | undefined {
  const raw = String(formData.get("mood") || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < -5 || n > 5) return undefined;
  return Math.round(n);
}

export async function createDiaryEntryAction(formData: FormData) {
  await requireDiaryAuth();

  const date = String(formData.get("date") || "").trim();
  const title = String(formData.get("title") || "").trim() || undefined;
  const body = String(formData.get("body") || "").trim();
  const mood = parseMood(formData);

  if (!date) throw new Error("날짜는 필수입니다");
  if (!ISO_DATE_RE.test(date)) throw new Error("날짜 형식 오류");
  if (!body) throw new Error("내용을 적어주세요");

  await createDiaryEntry({ date, title, body, mood });
  revalidatePath("/diary");
  redirect("/diary");
}

export async function updateDiaryEntryAction(formData: FormData) {
  await requireDiaryAuth();

  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  const date = String(formData.get("date") || "");
  if (!ISO_DATE_RE.test(date)) throw new Error("날짜 형식 오류");

  const patch: Partial<DiaryEntry> = {
    date,
    title: String(formData.get("title") || "").trim() || undefined,
    body: String(formData.get("body") || "").trim(),
    mood: parseMood(formData),
  };
  if (!patch.body) throw new Error("내용을 적어주세요");

  await updateDiaryEntry(year, id, patch);
  revalidatePath(`/diary/${year}/${id}`);
  revalidatePath("/diary");
  redirect(`/diary/${year}/${id}`);
}

export async function deleteDiaryEntryAction(formData: FormData) {
  await requireDiaryAuth();

  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  if (!/^\d{4}$/.test(year)) throw new Error("year 형식 오류");
  await deleteDiaryEntry(year, id);
  revalidatePath("/diary");
  redirect("/diary");
}
