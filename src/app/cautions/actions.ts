"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asPerson } from "@/lib/people";
import {
  createCaution,
  deleteCaution,
  updateCaution,
} from "@/lib/store";
import type { CautionItem, CautionSeverity } from "@/lib/types";

const SEVERITY_VALUES = new Set<CautionSeverity>([
  "danger",
  "warning",
  "caution",
]);

function parseSeverity(formData: FormData): CautionSeverity {
  const raw = String(formData.get("severity") || "").trim();
  return SEVERITY_VALUES.has(raw as CautionSeverity)
    ? (raw as CautionSeverity)
    : "caution";
}

function parseList(formData: FormData, name: string): string[] {
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

export async function createCautionAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const subject = asPerson(formData.get("subject"));
  const severity = parseSeverity(formData);
  const category = String(formData.get("category") || "").trim() || undefined;
  const medications = parseList(formData, "medications");
  const reason = String(formData.get("reason") || "").trim() || undefined;
  const source = String(formData.get("source") || "").trim() || undefined;

  if (!name) throw new Error("이름은 필수입니다");

  await createCaution({
    name,
    subject,
    severity,
    category,
    medications: medications.length > 0 ? medications : undefined,
    reason,
    source,
  });

  revalidatePath("/cautions");
  redirect("/cautions");
}

export async function updateCautionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("이름은 필수입니다");

  const medications = parseList(formData, "medications");

  const patch: Partial<CautionItem> = {
    name,
    subject: asPerson(formData.get("subject")),
    severity: parseSeverity(formData),
    category: String(formData.get("category") || "").trim() || undefined,
    medications: medications.length > 0 ? medications : undefined,
    reason: String(formData.get("reason") || "").trim() || undefined,
    source: String(formData.get("source") || "").trim() || undefined,
  };

  await updateCaution(id, patch);
  revalidatePath(`/cautions/${id}`);
  revalidatePath("/cautions");
  redirect("/cautions");
}

export async function deleteCautionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");
  await deleteCaution(id);
  revalidatePath("/cautions");
  redirect("/cautions");
}
