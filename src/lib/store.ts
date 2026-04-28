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
  for (const f of files) {
    const safeName = sanitizeFilename(f.filename);
    const path = `${visitAttachDir(year, id)}/${safeName}`;
    await writeFile(path, f.data, `add visit attachment ${safeName}`);
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
  await writeJSON(visitFile(year, id), visit, `add visit ${input.date} ${input.hospitalName}`);
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

  const added: Attachment[] = [];
  for (const f of newFiles) {
    const safeName = sanitizeFilename(f.filename);
    const path = `${visitAttachDir(year, id)}/${safeName}`;
    await writeFile(path, f.data, `add visit attachment ${safeName}`);
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
  await writeJSON(visitFile(year, id), next, `update visit ${id}`);
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
  await deleteFile(path, `remove visit attachment ${path}`);
  const next: Visit = {
    ...current,
    attachments: current.attachments.filter((a) => a.path !== path),
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(visitFile(year, id), next, `update visit ${id} (remove attachment)`);
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
  for (const f of files) {
    const safeName = sanitizeFilename(f.filename);
    const path = `${checkupAttachDir(year, id)}/${safeName}`;
    await writeFile(path, f.data, `add checkup attachment ${safeName}`);
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
  await writeJSON(checkupFile(year, id), checkup, `add checkup ${input.date} ${input.title}`);
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

  const added: Attachment[] = [];
  for (const f of newFiles) {
    const safeName = sanitizeFilename(f.filename);
    const path = `${checkupAttachDir(year, id)}/${safeName}`;
    await writeFile(path, f.data, `add checkup attachment ${safeName}`);
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
  await writeJSON(checkupFile(year, id), next, `update checkup ${id}`);
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
  await deleteFile(path, `remove checkup attachment ${path}`);
  const next: Checkup = {
    ...current,
    attachments: current.attachments.filter((a) => a.path !== path),
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(checkupFile(year, id), next, `update checkup ${id} (remove attachment)`);
}

// ============================================================
// Helpers
// ============================================================

function sanitizeFilename(name: string): string {
  // Keep extension; replace anything weird with underscore. Allow Korean chars.
  const cleaned = name.replace(/[\\/:*?"<>|\s]+/g, "_");
  return cleaned.slice(0, 120);
}
