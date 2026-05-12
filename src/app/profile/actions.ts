"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertProfile } from "@/lib/store";
import { PEOPLE } from "@/lib/people";
import type { ActivityLevel, PersonProfile } from "@/lib/types";

// Profile is only kept for tracked individuals — 전체 has no profile,
// 박범진 currently doesn't either (no diet tracking). Locking the allow-list
// here prevents an attacker (or stray client form) from writing an arbitrary
// data/profiles/<garbage>.json file in the data repo.
const PROFILE_PEOPLE = new Set<string>(
  PEOPLE.filter((p) => p !== "전체"),
);

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
  if (!PROFILE_PEOPLE.has(person)) {
    throw new Error("올바르지 않은 대상자");
  }

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
