"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asPerson, SUBJECT_COOKIE } from "@/lib/people";
import {
  createCondition,
  createExam,
  deleteCondition,
  deleteExam,
  getCondition,
  listConditions,
  updateCondition,
  updateExam,
} from "@/lib/store";
import { CONDITION_SEEDS, isConditionStatus } from "@/lib/health-conditions";
import type { ConditionStatus, HealthCondition } from "@/lib/types";

function parseStatus(formData: FormData): ConditionStatus {
  const raw = String(formData.get("status") || "").trim();
  return isConditionStatus(raw) ? raw : "추적중";
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Condition CRUD ----------

export async function createConditionAction(formData: FormData) {
  const bodyPart = String(formData.get("bodyPart") || "").trim();
  const diagnosis = String(formData.get("diagnosis") || "").trim();
  if (!bodyPart) throw new Error("부위는 필수입니다");
  if (!diagnosis) throw new Error("진단명은 필수입니다");

  const subject = asPerson(formData.get("subject"));
  const nextDate = String(formData.get("nextDate") || "").trim();

  await createCondition({
    subject,
    bodyPart,
    diagnosis,
    status: parseStatus(formData),
    summary: String(formData.get("summary") || "").trim() || undefined,
    nextAction: String(formData.get("nextAction") || "").trim() || undefined,
    nextDate: ISO_DATE_RE.test(nextDate) ? nextDate : undefined,
  });

  revalidatePath("/conditions");
  redirect("/conditions");
}

// 시드는 최진희 데이터이므로, 등록 후 전역 인물 컨텍스트를 최진희로 맞춰
// 사용자가 바로 결과를 보게 한다.
async function setSubjectCookie(person: string) {
  const store = await cookies();
  store.set(SUBJECT_COOKIE, person, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function updateConditionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");

  const bodyPart = String(formData.get("bodyPart") || "").trim();
  const diagnosis = String(formData.get("diagnosis") || "").trim();
  if (!bodyPart) throw new Error("부위는 필수입니다");
  if (!diagnosis) throw new Error("진단명은 필수입니다");

  const nextDate = String(formData.get("nextDate") || "").trim();

  const patch: Partial<HealthCondition> = {
    subject: asPerson(formData.get("subject")),
    bodyPart,
    diagnosis,
    status: parseStatus(formData),
    summary: String(formData.get("summary") || "").trim() || undefined,
    nextAction: String(formData.get("nextAction") || "").trim() || undefined,
    nextDate: ISO_DATE_RE.test(nextDate) ? nextDate : undefined,
  };

  await updateCondition(id, patch);
  revalidatePath("/conditions");
  revalidatePath(`/conditions/${id}`);
  redirect(`/conditions/${id}`);
}

// 상세 페이지에서 상태만 빠르게 변경
export async function setConditionStatusAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");
  await updateCondition(id, { status: parseStatus(formData) });
  revalidatePath("/conditions");
  revalidatePath(`/conditions/${id}`);
}

export async function deleteConditionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("id 누락");
  await deleteCondition(id);
  revalidatePath("/conditions");
  redirect("/conditions");
}

// ---------- Exam CRUD ----------

export async function createExamAction(formData: FormData) {
  const conditionId = String(formData.get("conditionId") || "");
  if (!conditionId) throw new Error("conditionId 누락");
  const condition = await getCondition(conditionId);
  if (!condition) throw new Error("질환을 찾을 수 없습니다");

  const date = String(formData.get("date") || "").trim();
  if (!ISO_DATE_RE.test(date)) throw new Error("검사일 형식이 올바르지 않습니다");
  const findings = String(formData.get("findings") || "").trim();
  if (!findings) throw new Error("소견·결과는 필수입니다");

  await createExam({
    conditionId,
    subject: condition.subject,
    date,
    org: String(formData.get("org") || "").trim() || undefined,
    examType: String(formData.get("examType") || "").trim() || undefined,
    findings,
  });

  // 검사 추가 시 상태도 같이 바꾸도록 선택 가능
  const newStatus = String(formData.get("newStatus") || "").trim();
  if (isConditionStatus(newStatus) && newStatus !== condition.status) {
    await updateCondition(conditionId, { status: newStatus });
  }

  revalidatePath("/conditions");
  revalidatePath(`/conditions/${conditionId}`);
  redirect(`/conditions/${conditionId}`);
}

export async function updateExamAction(formData: FormData) {
  const conditionId = String(formData.get("conditionId") || "");
  const examId = String(formData.get("examId") || "");
  if (!conditionId || !examId) throw new Error("id 누락");

  const date = String(formData.get("date") || "").trim();
  if (!ISO_DATE_RE.test(date)) throw new Error("검사일 형식이 올바르지 않습니다");
  const findings = String(formData.get("findings") || "").trim();
  if (!findings) throw new Error("소견·결과는 필수입니다");

  await updateExam(conditionId, examId, {
    date,
    org: String(formData.get("org") || "").trim() || undefined,
    examType: String(formData.get("examType") || "").trim() || undefined,
    findings,
  });

  revalidatePath(`/conditions/${conditionId}`);
  redirect(`/conditions/${conditionId}`);
}

export async function deleteExamAction(formData: FormData) {
  const conditionId = String(formData.get("conditionId") || "");
  const examId = String(formData.get("examId") || "");
  if (!conditionId || !examId) throw new Error("id 누락");
  await deleteExam(conditionId, examId);
  revalidatePath(`/conditions/${conditionId}`);
  redirect(`/conditions/${conditionId}`);
}

// ---------- Seed (최진희 실데이터 원클릭 등록) ----------

export async function seedConditionsAction() {
  const existing = await listConditions();
  const taken = new Set(
    existing.map((c) => `${c.subject}|${c.bodyPart}|${c.diagnosis}`),
  );

  for (const seed of CONDITION_SEEDS) {
    const key = `${seed.condition.subject}|${seed.condition.bodyPart}|${seed.condition.diagnosis}`;
    if (taken.has(key)) continue; // 이미 있으면 skip
    const created = await createCondition(seed.condition);
    for (const ex of seed.exams) {
      await createExam({
        conditionId: created.id,
        subject: created.subject,
        ...ex,
      });
    }
  }

  await setSubjectCookie("최진희");
  revalidatePath("/conditions");
  revalidatePath("/");
  redirect("/conditions");
}
