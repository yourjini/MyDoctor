"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asPerson } from "@/lib/people";
import {
  createMeal,
  deleteMeal,
  getMeal,
  updateMeal,
} from "@/lib/store";
import type { Meal, MealSlot } from "@/lib/types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SLOTS = new Set<MealSlot>([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

function parseSlot(formData: FormData): MealSlot {
  const raw = String(formData.get("slot") || "").trim();
  return SLOTS.has(raw as MealSlot) ? (raw as MealSlot) : "snack";
}

function parseTags(formData: FormData, name: string): string[] {
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

function parseTime(formData: FormData): string | undefined {
  const raw = String(formData.get("time") || "").trim();
  if (!raw) return undefined;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) return undefined;
  return raw;
}

function parseRating(formData: FormData): number | undefined {
  const raw = String(formData.get("rating") || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 5) return undefined;
  return Math.round(n);
}

export async function createMealAction(formData: FormData) {
  const date = String(formData.get("date") || "");
  const subject = asPerson(formData.get("subject"));
  const slot = parseSlot(formData);
  const menu = String(formData.get("menu") || "").trim();
  const tags = parseTags(formData, "tags");
  const note = String(formData.get("note") || "").trim() || undefined;
  const time = parseTime(formData);
  const rating = parseRating(formData);
  const fromLibraryId =
    String(formData.get("fromLibraryId") || "").trim() || undefined;

  if (!date) throw new Error("날짜는 필수입니다");
  if (!ISO_DATE_RE.test(date)) throw new Error("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)");
  if (!menu) throw new Error("메뉴는 필수입니다");

  await createMeal({
    subject,
    date,
    time,
    slot,
    menu,
    tags,
    rating,
    note,
    fromLibraryId,
  });

  revalidatePath("/meals");
  revalidatePath("/");
  redirect("/meals");
}

export async function updateMealAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  const month = String(formData.get("month") || "");
  if (!id || !year || !month) throw new Error("id/year/month 누락");
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
    throw new Error("year/month 형식 오류");
  }
  const date = String(formData.get("date") || "");
  if (!ISO_DATE_RE.test(date)) throw new Error("날짜 형식이 올바르지 않습니다");

  const patch: Partial<Meal> = {
    date,
    subject: asPerson(formData.get("subject")),
    slot: parseSlot(formData),
    menu: String(formData.get("menu") || "").trim(),
    tags: parseTags(formData, "tags"),
    note: String(formData.get("note") || "").trim() || undefined,
    time: parseTime(formData),
    rating: parseRating(formData),
  };

  // 식사는 data/meals/<year>/<month>/<id>.json 으로 저장됨.
  // 사용자가 date를 다른 월/년으로 옮기면 파일이 잘못된 디렉토리에 남게 됨.
  // 우선 새 위치에 같은 id로 갱신해 쓰고, 옛 위치를 지운다 (id 유지).
  const newYear = date.slice(0, 4);
  const newMonth = date.slice(5, 7);
  if (newYear !== year || newMonth !== month) {
    const current = await getMeal(year, month, id);
    if (!current) throw new Error("기존 기록을 찾을 수 없음");
    // 새 위치에는 아직 파일이 없으므로 updateMeal이 null을 반환한다.
    // 삭제 → createMeal로 옮긴다 (id는 새로 발급됨; 외부 참조 없음).
    await moveMealToNewMonth(current, patch, year, month);
  } else {
    await updateMeal(year, month, id, patch);
  }
  revalidatePath(`/meals/${year}/${month}/${id}`);
  revalidatePath(`/meals/${newYear}/${newMonth}/${id}`);
  revalidatePath("/meals");
  revalidatePath("/");
  redirect("/meals");
}

async function moveMealToNewMonth(
  current: Meal,
  patch: Partial<Meal>,
  oldYear: string,
  oldMonth: string,
): Promise<void> {
  // Cross-month rename: store에 전용 헬퍼가 없으므로 삭제 → 재생성으로 처리.
  // Trade-off: 새 id가 발급된다. 식사 기록은 외부 참조가 없으므로 허용 가능.
  await deleteMeal(oldYear, oldMonth, current.id);
  const merged = { ...current, ...patch } as Meal;
  await createMeal({
    subject: merged.subject,
    date: merged.date,
    time: merged.time,
    slot: merged.slot,
    menu: merged.menu,
    tags: merged.tags,
    rating: merged.rating,
    note: merged.note,
    fromLibraryId: merged.fromLibraryId,
  });
}

export async function deleteMealAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  const month = String(formData.get("month") || "");
  if (!id || !year || !month) throw new Error("id/year/month 누락");
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
    throw new Error("year/month 형식 오류");
  }
  await deleteMeal(year, month, id);
  revalidatePath("/meals");
  redirect("/meals");
}
