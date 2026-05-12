"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertProfile } from "@/lib/store";
import type { ActivityLevel, PersonProfile } from "@/lib/types";

const ACTIVITY_VALUES = new Set<ActivityLevel>([
  "low",
  "light",
  "moderate",
  "active",
]);

function parseNum(formData: FormData, name: string): number | undefined {
  const raw = String(formData.get(name) || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

function parseDate(formData: FormData, name: string): string | undefined {
  const raw = String(formData.get(name) || "").trim();
  if (!raw) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  return raw;
}

function parseTags(formData: FormData, name: string): string[] | undefined {
  const raw = String(formData.get(name) || "").trim();
  if (!raw) return undefined;
  const tags = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
}

export async function saveProfileAction(formData: FormData) {
  const person = String(formData.get("person") || "").trim();
  if (!person) throw new Error("대상자 누락");

  const activity = String(formData.get("activity") || "").trim();
  const dietStyle = String(formData.get("dietStyle") || "").trim();

  const patch: Omit<PersonProfile, "person" | "updatedAt"> = {
    birthDate: parseDate(formData, "birthDate"),
    heightCm: parseNum(formData, "heightCm"),
    startWeightKg: parseNum(formData, "startWeightKg"),
    startWeightDate: parseDate(formData, "startWeightDate"),
    targetWeightKg: parseNum(formData, "targetWeightKg"),
    activity: ACTIVITY_VALUES.has(activity as ActivityLevel)
      ? (activity as ActivityLevel)
      : undefined,
    dietStyle:
      dietStyle === "lowcarb-lowfat" ||
      dietStyle === "mediterranean" ||
      dietStyle === "balanced"
        ? dietStyle
        : undefined,
    allergies: parseTags(formData, "allergies"),
    notes: String(formData.get("notes") || "").trim() || undefined,
  };

  await upsertProfile(person, patch);
  revalidatePath("/profile");
  revalidatePath("/meals");
  redirect("/profile");
}
