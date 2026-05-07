"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMenstrualCycle,
  deleteMenstrualCycle,
  getMenstrualCycle,
  listMenstrualCycles,
  updateMenstrualCycle,
} from "@/lib/store";
import type { MenstruationFlow } from "@/lib/types";

const PERIOD_SUBJECTS = ["박란하", "최진희"] as const;

function asPeriodSubject(value: unknown): string {
  if (
    typeof value === "string" &&
    (PERIOD_SUBJECTS as readonly string[]).includes(value)
  ) {
    return value;
  }
  return "최진희";
}

function todayKST(): string {
  const now = new Date();
  // KST = UTC+9
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function parseFlow(value: unknown): MenstruationFlow | undefined {
  if (value === "light" || value === "normal" || value === "heavy") return value;
  return undefined;
}

// 오늘 생리 시작 — 같은 사람이 진행 중인 사이클이 있으면 거기 종료일을 채우는 것이
// 더 자연스러우므로 거부하지는 않고 그냥 새 사이클을 만든다 (기간 겹치면 사용자가
// 직접 정리). 진행 중 사이클 처리는 startToday/endToday 두 액션 분리로 명확하게.

export async function startTodayAction(formData: FormData) {
  const subject = asPeriodSubject(formData.get("subject"));
  const startDate = todayKST();

  // 같은 subject의 진행 중인 (endDate 비어있는) 사이클이 이미 있으면 막는다.
  const existing = await listMenstrualCycles();
  const ongoing = existing.find(
    (c) => c.subject === subject && !c.endDate,
  );
  if (ongoing) {
    throw new Error(
      `${subject}의 진행 중 사이클이 있습니다 (${ongoing.startDate} 시작). 먼저 종료하거나 그 사이클을 수정하세요.`,
    );
  }

  await createMenstrualCycle({ subject, startDate });
  revalidatePath("/period");
  redirect("/period");
}

export async function endTodayAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  await updateMenstrualCycle(year, id, { endDate: todayKST() });
  revalidatePath("/period");
  redirect("/period");
}

export async function createCycleAction(formData: FormData) {
  const subject = asPeriodSubject(formData.get("subject"));
  const startDate = String(formData.get("startDate") || "").trim();
  const endDateRaw = String(formData.get("endDate") || "").trim();
  const endDate = endDateRaw || undefined;
  const flow = parseFlow(formData.get("flow"));
  const notes = String(formData.get("notes") || "").trim() || undefined;

  if (!startDate) throw new Error("시작일은 필수입니다");
  if (endDate && endDate < startDate) {
    throw new Error("종료일은 시작일과 같거나 이후여야 합니다");
  }

  await createMenstrualCycle({
    subject,
    startDate,
    endDate,
    flow,
    notes,
  });
  revalidatePath("/period");
  redirect("/period");
}

export async function updateCycleAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");

  const subject = asPeriodSubject(formData.get("subject"));
  const startDate = String(formData.get("startDate") || "").trim();
  const endDateRaw = String(formData.get("endDate") || "").trim();
  const endDate = endDateRaw || undefined;
  const flow = parseFlow(formData.get("flow"));
  const notes = String(formData.get("notes") || "").trim() || undefined;

  if (!startDate) throw new Error("시작일은 필수입니다");
  if (endDate && endDate < startDate) {
    throw new Error("종료일은 시작일과 같거나 이후여야 합니다");
  }

  const current = await getMenstrualCycle(year, id);
  if (!current) throw new Error("기록을 찾을 수 없음");

  await updateMenstrualCycle(year, id, {
    subject,
    startDate,
    endDate,
    flow,
    notes,
  });
  revalidatePath(`/period/${year}/${id}`);
  revalidatePath("/period");
  redirect("/period");
}

export async function deleteCycleAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  await deleteMenstrualCycle(year, id);
  revalidatePath("/period");
  redirect("/period");
}

