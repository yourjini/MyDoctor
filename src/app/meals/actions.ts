"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asPerson } from "@/lib/people";
import { createMeal, deleteMeal, updateMeal } from "@/lib/store";
import type { Meal, MealMacros, MealSlot } from "@/lib/types";

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

function parseNumber(formData: FormData, name: string): number | undefined {
  const raw = String(formData.get(name) || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function parseMacros(formData: FormData): MealMacros | undefined {
  const c = parseNumber(formData, "carbG");
  const p = parseNumber(formData, "proteinG");
  const f = parseNumber(formData, "fatG");
  if (c == null && p == null && f == null) return undefined;
  return { carbG: c, proteinG: p, fatG: f };
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
  const calories = parseNumber(formData, "calories");
  const macros = parseMacros(formData);
  const tags = parseTags(formData, "tags");
  const note = String(formData.get("note") || "").trim() || undefined;
  const time = parseTime(formData);
  const rating = parseRating(formData);
  const fromLibraryId =
    String(formData.get("fromLibraryId") || "").trim() || undefined;

  if (!date) throw new Error("날짜는 필수입니다");
  if (!menu) throw new Error("메뉴는 필수입니다");

  await createMeal({
    subject,
    date,
    time,
    slot,
    menu,
    calories,
    macros,
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

  const patch: Partial<Meal> = {
    date: String(formData.get("date") || ""),
    subject: asPerson(formData.get("subject")),
    slot: parseSlot(formData),
    menu: String(formData.get("menu") || "").trim(),
    calories: parseNumber(formData, "calories"),
    macros: parseMacros(formData),
    tags: parseTags(formData, "tags"),
    note: String(formData.get("note") || "").trim() || undefined,
    time: parseTime(formData),
    rating: parseRating(formData),
  };

  await updateMeal(year, month, id, patch);
  revalidatePath(`/meals/${year}/${month}/${id}`);
  revalidatePath("/meals");
  revalidatePath("/");
  redirect("/meals");
}

export async function deleteMealAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  const month = String(formData.get("month") || "");
  if (!id || !year || !month) throw new Error("id/year/month 누락");
  await deleteMeal(year, month, id);
  revalidatePath("/meals");
  redirect("/meals");
}
