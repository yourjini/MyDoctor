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
  Checkup,
  HealthLog,
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
