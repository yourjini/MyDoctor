// Higher-level store on top of github.ts: per-record CRUD

import { v4 as uuid } from "uuid";
import {
  deleteFile,
  listAllJSON,
  listDir,
  readJSON,
  writeFile,
  writeJSON,
} from "./github";
import type {
  Appointment,
  Attachment,
  CautionItem,
  Checkup,
  ClinicNote,
  ConditionExam,
  DiaryEntry,
  HealthCondition,
  HealthLog,
  Meal,
  MenstrualCycle,
  PersonProfile,
  Visit,
} from "./types";

// Path helpers
const visitDir = (year: string) => `data/visits/${year}`;
const visitFile = (year: string, id: string) => `${visitDir(year)}/${id}.json`;
const visitAttachDir = (year: string, id: string) =>
  `${visitDir(year)}/${id}-files`;

const apptDir = (year: string) => `data/appointments/${year}`;
const apptFile = (year: string, id: string) => `${apptDir(year)}/${id}.json`;

const checkupDir = (year: string) => `data/checkups/${year}`;
const checkupFile = (year: string, id: string) =>
  `${checkupDir(year)}/${id}.json`;
const checkupAttachDir = (year: string, id: string) =>
  `${checkupDir(year)}/${id}-files`;

const healthDir = (year: string) => `data/health/${year}`;
const healthFile = (year: string, id: string) =>
  `${healthDir(year)}/${id}.json`;

const periodDir = (year: string) => `data/period/${year}`;
const periodFile = (year: string, id: string) =>
  `${periodDir(year)}/${id}.json`;

const profileFile = (person: string) =>
  `data/profiles/${encodeURIComponent(person)}.json`;

const mealDir = (year: string, month: string) =>
  `data/meals/${year}/${month}`;
const mealFile = (year: string, month: string, id: string) =>
  `${mealDir(year, month)}/${id}.json`;

const diaryDir = (year: string) => `data/diary/${year}`;
const diaryFile = (year: string, id: string) =>
  `${diaryDir(year)}/${id}.json`;

// Cautions: flat, not partitioned by year — small reference list per family.
const cautionFile = (id: string) => `data/cautions/${id}.json`;

// Clinic notes: flat, lifecycle-based (pending → done). Few open at a time.
const clinicNoteFile = (id: string) => `data/notes/${id}.json`;

// 부위별 질환 트래커. condition은 flat, exam은 그 하위에 누적.
const conditionRoot = "data/conditions";
const conditionFile = (id: string) => `${conditionRoot}/${id}.json`;
const examDir = (conditionId: string) => `${conditionRoot}/${conditionId}/exams`;
const examFile = (conditionId: string, examId: string) =>
  `${examDir(conditionId)}/${examId}.json`;

function ymOf(date: string): { year: string; month: string } {
  return { year: date.slice(0, 4), month: date.slice(5, 7) };
}

function yearOf(date: string): string {
  return date.slice(0, 4);
}

// ============================================================
// Visits
// ============================================================

export async function listVisits(): Promise<Visit[]> {
  const all = await listAllJSON<Visit>("data/visits");
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getVisit(year: string, id: string): Promise<Visit | null> {
  return readJSON<Visit>(visitFile(year, id));
}

export async function createVisit(
  input: Omit<Visit, "id" | "kind" | "createdAt" | "updatedAt" | "attachments">,
  files: { filename: string; contentType: string; data: Buffer }[],
): Promise<Visit> {
  const id = uuid();
  const year = yearOf(input.date);
  const now = new Date().toISOString();

  const attachments: Attachment[] = [];
  const taken = new Set<string>();
  for (const f of files) {
    const safeName = uniqueName(sanitizeFilename(f.filename), taken);
    taken.add(safeName);
    const path = `${visitAttachDir(year, id)}/${safeName}`;
    try {
      await writeFile(path, f.data, `add visit attachment ${safeName}`);
    } catch (err) {
      throw new Error(
        `첨부 파일 업로드 실패 (${f.filename}): ${describeError(err)}`,
      );
    }
    attachments.push({
      filename: f.filename,
      path,
      contentType: f.contentType,
      size: f.data.length,
    });
  }

  const visit: Visit = {
    id,
    kind: "visit",
    ...input,
    attachments,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(
      visitFile(year, id),
      visit,
      `add visit ${input.date} ${input.hospitalName}`,
    );
  } catch (err) {
    throw new Error(`방문 기록 저장 실패: ${describeError(err)}`);
  }
  return visit;
}

export async function updateVisit(
  year: string,
  id: string,
  patch: Partial<Visit>,
  newFiles: { filename: string; contentType: string; data: Buffer }[] = [],
): Promise<Visit | null> {
  const current = await getVisit(year, id);
  if (!current) return null;

  const taken = new Set(current.attachments.map((a) => basename(a.path)));
  const added: Attachment[] = [];
  for (const f of newFiles) {
    const safeName = uniqueName(sanitizeFilename(f.filename), taken);
    taken.add(safeName);
    const path = `${visitAttachDir(year, id)}/${safeName}`;
    try {
      await writeFile(path, f.data, `add visit attachment ${safeName}`);
    } catch (err) {
      throw new Error(
        `첨부 파일 업로드 실패 (${f.filename}): ${describeError(err)}`,
      );
    }
    added.push({
      filename: f.filename,
      path,
      contentType: f.contentType,
      size: f.data.length,
    });
  }

  const next: Visit = {
    ...current,
    ...patch,
    id: current.id,
    kind: "visit",
    attachments: [...current.attachments, ...added],
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(visitFile(year, id), next, `update visit ${id}`);
  } catch (err) {
    throw new Error(`방문 기록 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteVisit(year: string, id: string): Promise<void> {
  // delete attachments first
  const attachs = await listDir(visitAttachDir(year, id));
  for (const a of attachs) {
    if (a.type === "file") await deleteFile(a.path, `delete visit attachment ${id}`);
  }
  await deleteFile(visitFile(year, id), `delete visit ${id}`);
}

export async function removeVisitAttachment(
  year: string,
  id: string,
  path: string,
): Promise<void> {
  const current = await getVisit(year, id);
  if (!current) return;
  if (!current.attachments.some((a) => a.path === path)) return;
  try {
    await deleteFile(path, `remove visit attachment ${path}`);
  } catch (err) {
    throw new Error(`첨부 파일 삭제 실패: ${describeError(err)}`);
  }
  const next: Visit = {
    ...current,
    attachments: current.attachments.filter((a) => a.path !== path),
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(
      visitFile(year, id),
      next,
      `update visit ${id} (remove attachment)`,
    );
  } catch (err) {
    throw new Error(`방문 기록 갱신 실패: ${describeError(err)}`);
  }
}

// ============================================================
// Appointments
// ============================================================

export async function listAppointments(): Promise<Appointment[]> {
  const all = await listAllJSON<Appointment>("data/appointments");
  return all.sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export async function getAppointment(
  year: string,
  id: string,
): Promise<Appointment | null> {
  return readJSON<Appointment>(apptFile(year, id));
}

export async function createAppointment(
  input: Omit<Appointment, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<Appointment> {
  const id = uuid();
  const year = input.datetime.slice(0, 4);
  const now = new Date().toISOString();
  const appt: Appointment = {
    id,
    kind: "appointment",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await writeJSON(apptFile(year, id), appt, `add appointment ${input.datetime}`);
  return appt;
}

export async function updateAppointment(
  year: string,
  id: string,
  patch: Partial<Appointment>,
): Promise<Appointment | null> {
  const current = await getAppointment(year, id);
  if (!current) return null;
  const next: Appointment = {
    ...current,
    ...patch,
    id: current.id,
    kind: "appointment",
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(apptFile(year, id), next, `update appointment ${id}`);
  return next;
}

export async function deleteAppointment(year: string, id: string): Promise<void> {
  await deleteFile(apptFile(year, id), `delete appointment ${id}`);
}

// ============================================================
// Checkups
// ============================================================

export async function listCheckups(): Promise<Checkup[]> {
  const all = await listAllJSON<Checkup>("data/checkups");
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getCheckup(
  year: string,
  id: string,
): Promise<Checkup | null> {
  return readJSON<Checkup>(checkupFile(year, id));
}

export async function createCheckup(
  input: Omit<Checkup, "id" | "kind" | "createdAt" | "updatedAt" | "attachments">,
  files: { filename: string; contentType: string; data: Buffer }[],
): Promise<Checkup> {
  const id = uuid();
  const year = yearOf(input.date);
  const now = new Date().toISOString();

  const attachments: Attachment[] = [];
  const taken = new Set<string>();
  for (const f of files) {
    const safeName = uniqueName(sanitizeFilename(f.filename), taken);
    taken.add(safeName);
    const path = `${checkupAttachDir(year, id)}/${safeName}`;
    try {
      await writeFile(path, f.data, `add checkup attachment ${safeName}`);
    } catch (err) {
      throw new Error(
        `검진 파일 업로드 실패 (${f.filename}): ${describeError(err)}`,
      );
    }
    attachments.push({
      filename: f.filename,
      path,
      contentType: f.contentType,
      size: f.data.length,
    });
  }

  const checkup: Checkup = {
    id,
    kind: "checkup",
    ...input,
    attachments,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(
      checkupFile(year, id),
      checkup,
      `add checkup ${input.date} ${input.title}`,
    );
  } catch (err) {
    throw new Error(`검진 기록 저장 실패: ${describeError(err)}`);
  }
  return checkup;
}

export async function updateCheckup(
  year: string,
  id: string,
  patch: Partial<Checkup>,
  newFiles: { filename: string; contentType: string; data: Buffer }[] = [],
): Promise<Checkup | null> {
  const current = await getCheckup(year, id);
  if (!current) return null;

  const taken = new Set(current.attachments.map((a) => basename(a.path)));
  const added: Attachment[] = [];
  for (const f of newFiles) {
    const safeName = uniqueName(sanitizeFilename(f.filename), taken);
    taken.add(safeName);
    const path = `${checkupAttachDir(year, id)}/${safeName}`;
    try {
      await writeFile(path, f.data, `add checkup attachment ${safeName}`);
    } catch (err) {
      throw new Error(
        `검진 파일 업로드 실패 (${f.filename}): ${describeError(err)}`,
      );
    }
    added.push({
      filename: f.filename,
      path,
      contentType: f.contentType,
      size: f.data.length,
    });
  }

  const next: Checkup = {
    ...current,
    ...patch,
    id: current.id,
    kind: "checkup",
    attachments: [...current.attachments, ...added],
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(checkupFile(year, id), next, `update checkup ${id}`);
  } catch (err) {
    throw new Error(`검진 기록 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteCheckup(year: string, id: string): Promise<void> {
  const attachs = await listDir(checkupAttachDir(year, id));
  for (const a of attachs) {
    if (a.type === "file") await deleteFile(a.path, `delete checkup attachment ${id}`);
  }
  await deleteFile(checkupFile(year, id), `delete checkup ${id}`);
}

export async function removeCheckupAttachment(
  year: string,
  id: string,
  path: string,
): Promise<void> {
  const current = await getCheckup(year, id);
  if (!current) return;
  if (!current.attachments.some((a) => a.path === path)) return;
  try {
    await deleteFile(path, `remove checkup attachment ${path}`);
  } catch (err) {
    throw new Error(`첨부 파일 삭제 실패: ${describeError(err)}`);
  }
  const next: Checkup = {
    ...current,
    attachments: current.attachments.filter((a) => a.path !== path),
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(
      checkupFile(year, id),
      next,
      `update checkup ${id} (remove attachment)`,
    );
  } catch (err) {
    throw new Error(`검진 기록 갱신 실패: ${describeError(err)}`);
  }
}

// ============================================================
// Health logs
// ============================================================

export async function listHealthLogs(): Promise<HealthLog[]> {
  const all = await listAllJSON<HealthLog>("data/health");
  return all.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const at = a.measuredAt ?? a.createdAt.slice(11, 16);
    const bt = b.measuredAt ?? b.createdAt.slice(11, 16);
    if (at !== bt) return bt.localeCompare(at);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function getHealthLog(
  year: string,
  id: string,
): Promise<HealthLog | null> {
  return readJSON<HealthLog>(healthFile(year, id));
}

export async function createHealthLog(
  input: Omit<HealthLog, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<HealthLog> {
  const id = uuid();
  const year = yearOf(input.date);
  const now = new Date().toISOString();
  const log: HealthLog = {
    id,
    kind: "health",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(healthFile(year, id), log, `add health log ${input.date}`);
  } catch (err) {
    throw new Error(`건강일지 저장 실패: ${describeError(err)}`);
  }
  return log;
}

export async function updateHealthLog(
  year: string,
  id: string,
  patch: Partial<HealthLog>,
): Promise<HealthLog | null> {
  const current = await getHealthLog(year, id);
  if (!current) return null;
  const next: HealthLog = {
    ...current,
    ...patch,
    id: current.id,
    kind: "health",
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(healthFile(year, id), next, `update health log ${id}`);
  } catch (err) {
    throw new Error(`건강일지 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteHealthLog(year: string, id: string): Promise<void> {
  await deleteFile(healthFile(year, id), `delete health log ${id}`);
}

// ============================================================
// Menstrual cycles
// ============================================================

export async function listMenstrualCycles(): Promise<MenstrualCycle[]> {
  const all = await listAllJSON<MenstrualCycle>("data/period");
  return all.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getMenstrualCycle(
  year: string,
  id: string,
): Promise<MenstrualCycle | null> {
  return readJSON<MenstrualCycle>(periodFile(year, id));
}

export async function createMenstrualCycle(
  input: Omit<MenstrualCycle, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<MenstrualCycle> {
  const id = uuid();
  const year = yearOf(input.startDate);
  const now = new Date().toISOString();
  const cycle: MenstrualCycle = {
    id,
    kind: "period",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(
      periodFile(year, id),
      cycle,
      `add period cycle ${input.subject} ${input.startDate}`,
    );
  } catch (err) {
    throw new Error(`생리주기 저장 실패: ${describeError(err)}`);
  }
  return cycle;
}

export async function updateMenstrualCycle(
  year: string,
  id: string,
  patch: Partial<MenstrualCycle>,
): Promise<MenstrualCycle | null> {
  const current = await getMenstrualCycle(year, id);
  if (!current) return null;
  const next: MenstrualCycle = {
    ...current,
    ...patch,
    id: current.id,
    kind: "period",
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(periodFile(year, id), next, `update period cycle ${id}`);
  } catch (err) {
    throw new Error(`생리주기 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteMenstrualCycle(
  year: string,
  id: string,
): Promise<void> {
  await deleteFile(periodFile(year, id), `delete period cycle ${id}`);
}

// ============================================================
// Person profiles
// ============================================================

export async function getProfile(
  person: string,
): Promise<PersonProfile | null> {
  return readJSON<PersonProfile>(profileFile(person));
}

export async function upsertProfile(
  person: string,
  patch: Omit<PersonProfile, "person" | "updatedAt">,
): Promise<PersonProfile> {
  const current = await getProfile(person);
  const next: PersonProfile = {
    ...(current ?? { person }),
    ...patch,
    person,
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(profileFile(person), next, `update profile ${person}`);
  } catch (err) {
    throw new Error(`프로필 저장 실패: ${describeError(err)}`);
  }
  return next;
}

// ============================================================
// Meals
// ============================================================

export async function listMeals(): Promise<Meal[]> {
  const all = await listAllJSON<Meal>("data/meals");
  return all.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const at = a.time ?? a.createdAt.slice(11, 16);
    const bt = b.time ?? b.createdAt.slice(11, 16);
    if (at !== bt) return bt.localeCompare(at);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function getMeal(
  year: string,
  month: string,
  id: string,
): Promise<Meal | null> {
  return readJSON<Meal>(mealFile(year, month, id));
}

export async function createMeal(
  input: Omit<Meal, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<Meal> {
  const id = uuid();
  const { year, month } = ymOf(input.date);
  const now = new Date().toISOString();
  const meal: Meal = {
    id,
    kind: "meal",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(
      mealFile(year, month, id),
      meal,
      `add meal ${input.date} ${input.slot}`,
    );
  } catch (err) {
    throw new Error(`식사 저장 실패: ${describeError(err)}`);
  }
  return meal;
}

export async function updateMeal(
  year: string,
  month: string,
  id: string,
  patch: Partial<Meal>,
): Promise<Meal | null> {
  const current = await getMeal(year, month, id);
  if (!current) return null;
  const next: Meal = {
    ...current,
    ...patch,
    id: current.id,
    kind: "meal",
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(mealFile(year, month, id), next, `update meal ${id}`);
  } catch (err) {
    throw new Error(`식사 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteMeal(
  year: string,
  month: string,
  id: string,
): Promise<void> {
  await deleteFile(mealFile(year, month, id), `delete meal ${id}`);
}

// ============================================================
// Diary (private — locked by separate password)
// ============================================================

export async function listDiaryEntries(): Promise<DiaryEntry[]> {
  const all = await listAllJSON<DiaryEntry>("data/diary");
  return all.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function getDiaryEntry(
  year: string,
  id: string,
): Promise<DiaryEntry | null> {
  return readJSON<DiaryEntry>(diaryFile(year, id));
}

export async function createDiaryEntry(
  input: Omit<DiaryEntry, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<DiaryEntry> {
  const id = uuid();
  const year = yearOf(input.date);
  const now = new Date().toISOString();
  const entry: DiaryEntry = {
    id,
    kind: "diary",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(diaryFile(year, id), entry, `add diary ${input.date}`);
  } catch (err) {
    throw new Error(`다이어리 저장 실패: ${describeError(err)}`);
  }
  return entry;
}

export async function updateDiaryEntry(
  year: string,
  id: string,
  patch: Partial<DiaryEntry>,
): Promise<DiaryEntry | null> {
  const current = await getDiaryEntry(year, id);
  if (!current) return null;
  const next: DiaryEntry = {
    ...current,
    ...patch,
    id: current.id,
    kind: "diary",
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(diaryFile(year, id), next, `update diary ${id}`);
  } catch (err) {
    throw new Error(`다이어리 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteDiaryEntry(
  year: string,
  id: string,
): Promise<void> {
  await deleteFile(diaryFile(year, id), `delete diary ${id}`);
}

// ============================================================
// Cautions (음식/음료/약물 주의 목록)
// ============================================================

const SEVERITY_ORDER: Record<string, number> = {
  danger: 0,
  warning: 1,
  caution: 2,
};

export async function listCautions(): Promise<CautionItem[]> {
  const all = await listAllJSON<CautionItem>("data/cautions");
  return all.sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 99;
    const sb = SEVERITY_ORDER[b.severity] ?? 99;
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name, "ko");
  });
}

export async function getCaution(id: string): Promise<CautionItem | null> {
  return readJSON<CautionItem>(cautionFile(id));
}

export async function createCaution(
  input: Omit<CautionItem, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<CautionItem> {
  const id = uuid();
  const now = new Date().toISOString();
  const item: CautionItem = {
    id,
    kind: "caution",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(cautionFile(id), item, `add caution ${input.name}`);
  } catch (err) {
    throw new Error(`주의 항목 저장 실패: ${describeError(err)}`);
  }
  return item;
}

export async function updateCaution(
  id: string,
  patch: Partial<CautionItem>,
): Promise<CautionItem | null> {
  const current = await getCaution(id);
  if (!current) return null;
  const next: CautionItem = {
    ...current,
    ...patch,
    id: current.id,
    kind: "caution",
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(cautionFile(id), next, `update caution ${id}`);
  } catch (err) {
    throw new Error(`주의 항목 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteCaution(id: string): Promise<void> {
  await deleteFile(cautionFile(id), `delete caution ${id}`);
}

// ============================================================
// Clinic notes (선생님에게 전달할 사항)
// ============================================================

export async function listClinicNotes(): Promise<ClinicNote[]> {
  const all = await listAllJSON<ClinicNote>("data/notes");
  return all.sort((a, b) => {
    // pending 먼저, 그 다음 done. 같은 상태 안에서는 최신순.
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function getClinicNote(id: string): Promise<ClinicNote | null> {
  return readJSON<ClinicNote>(clinicNoteFile(id));
}

export async function createClinicNote(
  input: Omit<ClinicNote, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<ClinicNote> {
  const id = uuid();
  const now = new Date().toISOString();
  const note: ClinicNote = {
    id,
    kind: "note",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(
      clinicNoteFile(id),
      note,
      `add clinic note ${input.title ?? input.body.slice(0, 30)}`,
    );
  } catch (err) {
    throw new Error(`선생님 메모 저장 실패: ${describeError(err)}`);
  }
  return note;
}

export async function updateClinicNote(
  id: string,
  patch: Partial<ClinicNote>,
): Promise<ClinicNote | null> {
  const current = await getClinicNote(id);
  if (!current) return null;
  const next: ClinicNote = {
    ...current,
    ...patch,
    id: current.id,
    kind: "note",
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(clinicNoteFile(id), next, `update clinic note ${id}`);
  } catch (err) {
    throw new Error(`선생님 메모 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteClinicNote(id: string): Promise<void> {
  await deleteFile(clinicNoteFile(id), `delete clinic note ${id}`);
}

// ============================================================
// 부위별 질환 트래커 (건강일지) — HealthCondition + ConditionExam
// ============================================================

export async function listConditions(): Promise<HealthCondition[]> {
  const all = await listAllJSON<HealthCondition>(conditionRoot);
  // listAllJSON은 하위 exam 파일까지 가져오므로 kind로 분리.
  return all.filter((c) => c.kind === "condition");
}

// condition + exam을 한 번의 walk로 모두 읽어 분리 (목록 페이지의 N+1 방지).
export async function listConditionRecords(): Promise<{
  conditions: HealthCondition[];
  exams: ConditionExam[];
}> {
  const all = await listAllJSON<HealthCondition | ConditionExam>(conditionRoot);
  const conditions: HealthCondition[] = [];
  const exams: ConditionExam[] = [];
  for (const r of all) {
    if (r.kind === "condition") conditions.push(r as HealthCondition);
    else if (r.kind === "exam") exams.push(r as ConditionExam);
  }
  return { conditions, exams };
}

export async function getCondition(
  id: string,
): Promise<HealthCondition | null> {
  return readJSON<HealthCondition>(conditionFile(id));
}

export async function createCondition(
  input: Omit<HealthCondition, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<HealthCondition> {
  const id = uuid();
  const now = new Date().toISOString();
  const condition: HealthCondition = {
    id,
    kind: "condition",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(
      conditionFile(id),
      condition,
      `add condition ${input.bodyPart} ${input.diagnosis}`,
    );
  } catch (err) {
    throw new Error(`질환 저장 실패: ${describeError(err)}`);
  }
  return condition;
}

export async function updateCondition(
  id: string,
  patch: Partial<HealthCondition>,
): Promise<HealthCondition | null> {
  const current = await getCondition(id);
  if (!current) return null;
  const next: HealthCondition = {
    ...current,
    ...patch,
    id: current.id,
    kind: "condition",
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(conditionFile(id), next, `update condition ${id}`);
  } catch (err) {
    throw new Error(`질환 수정 실패: ${describeError(err)}`);
  }
  return next;
}

async function deleteTree(path: string): Promise<void> {
  const entries = await listDir(path);
  for (const e of entries) {
    if (e.type === "dir") {
      await deleteTree(e.path);
    } else {
      await deleteFile(e.path, `delete ${e.path}`);
    }
  }
}

export async function deleteCondition(id: string): Promise<void> {
  // 하위 exam 파일·첨부(향후) 전체를 재귀로 정리한 뒤 condition 삭제.
  await deleteTree(examDir(id));
  await deleteFile(conditionFile(id), `delete condition ${id}`);
}

export async function listExamsFor(
  conditionId: string,
): Promise<ConditionExam[]> {
  const all = await listAllJSON<ConditionExam>(examDir(conditionId));
  return all
    .filter((e) => e.kind === "exam")
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export async function getExam(
  conditionId: string,
  examId: string,
): Promise<ConditionExam | null> {
  return readJSON<ConditionExam>(examFile(conditionId, examId));
}

export async function createExam(
  input: Omit<ConditionExam, "id" | "kind" | "createdAt" | "updatedAt">,
): Promise<ConditionExam> {
  const id = uuid();
  const now = new Date().toISOString();
  const exam: ConditionExam = {
    id,
    kind: "exam",
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await writeJSON(
      examFile(input.conditionId, id),
      exam,
      `add exam ${input.date} (${input.conditionId})`,
    );
  } catch (err) {
    throw new Error(`검사 기록 저장 실패: ${describeError(err)}`);
  }
  return exam;
}

export async function updateExam(
  conditionId: string,
  examId: string,
  patch: Partial<ConditionExam>,
): Promise<ConditionExam | null> {
  const current = await getExam(conditionId, examId);
  if (!current) return null;
  const next: ConditionExam = {
    ...current,
    ...patch,
    id: current.id,
    kind: "exam",
    conditionId: current.conditionId,
    updatedAt: new Date().toISOString(),
  };
  try {
    await writeJSON(examFile(conditionId, examId), next, `update exam ${examId}`);
  } catch (err) {
    throw new Error(`검사 기록 수정 실패: ${describeError(err)}`);
  }
  return next;
}

export async function deleteExam(
  conditionId: string,
  examId: string,
): Promise<void> {
  await deleteFile(examFile(conditionId, examId), `delete exam ${examId}`);
}

// ============================================================
// Helpers
// ============================================================

function sanitizeFilename(name: string): string {
  // Keep extension; replace anything weird with underscore. Allow Korean chars.
  const cleaned = name.replace(/[\\/:*?"<>|\s]+/g, "_");
  return cleaned.slice(0, 120);
}

function uniqueName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  for (let i = 1; i < 1000; i++) {
    const candidate = `${stem}_${i}${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${stem}_${Date.now()}${ext}`;
}

function basename(p: string): string {
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
