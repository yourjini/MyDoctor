"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del as deleteBlob } from "@vercel/blob";
import {
  createCheckup,
  deleteCheckup,
  removeCheckupAttachment,
  updateCheckup,
} from "@/lib/store";
import { asPerson } from "@/lib/people";
import { heicToJpeg, isHeic, jpegFilenameFor } from "@/lib/images";
import type { Checkup } from "@/lib/types";

type FileBuf = { filename: string; contentType: string; data: Buffer };

type BlobRef = {
  url: string;
  filename: string;
  contentType: string;
  size: number;
};

// 업로드된 파일을 모음: (a) FormData에 직접 실린 작은 파일,
// (b) blob_urls JSON으로 전달된 큰 파일 (Vercel Blob에 직접 올린 것).
async function collectUploadedFiles(formData: FormData): Promise<{
  files: FileBuf[];
  blobUrlsToCleanup: string[];
}> {
  const out: FileBuf[] = [];
  const blobUrlsToCleanup: string[] = [];

  // (a) FormData 파일
  const directFiles = formData.getAll("files") as File[];
  for (const f of directFiles) {
    if (!(f instanceof File) || f.size === 0) continue;
    out.push(await convertFileBuf(f.name, f.type, Buffer.from(await f.arrayBuffer())));
  }

  // (b) Blob 업로드 메타
  const blobUrlsRaw = String(formData.get("blob_urls") || "").trim();
  if (blobUrlsRaw) {
    let blobs: BlobRef[] = [];
    try {
      blobs = JSON.parse(blobUrlsRaw) as BlobRef[];
    } catch {
      throw new Error("blob_urls 파싱 실패");
    }
    for (const b of blobs) {
      const res = await fetch(b.url);
      if (!res.ok) {
        throw new Error(`Blob 다운로드 실패 (${b.filename}): ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      out.push(
        await convertFileBuf(
          b.filename,
          b.contentType || "application/octet-stream",
          buf,
        ),
      );
      blobUrlsToCleanup.push(b.url);
    }
  }

  return { files: out, blobUrlsToCleanup };
}

async function convertFileBuf(
  filename: string,
  contentType: string,
  data: Buffer,
): Promise<FileBuf> {
  let buf = data;
  let name = filename;
  let ct = contentType || "application/octet-stream";
  if (isHeic(name, ct)) {
    try {
      buf = await heicToJpeg(buf);
      name = jpegFilenameFor(name);
      ct = "image/jpeg";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`HEIC 변환 실패 (${filename}): ${msg}`);
    }
  }
  return { filename: name, contentType: ct, data: buf };
}

async function cleanupBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  // 실패해도 메인 흐름 막지 않음 — 다음 cron으로 정리하는 게 이상적이지만
  // 일단은 log만 남김.
  await Promise.all(
    urls.map(async (url) => {
      try {
        await deleteBlob(url);
      } catch (err) {
        console.warn("blob cleanup failed", url, err);
      }
    }),
  );
}

export async function createCheckupAction(formData: FormData) {
  const date = String(formData.get("date") || "").trim();
  const subject = asPerson(formData.get("subject"));
  const title = String(formData.get("title") || "").trim();
  const hospitalName = String(formData.get("hospitalName") || "").trim() || undefined;
  const summary = String(formData.get("summary") || "").trim();
  const symptoms = String(formData.get("symptoms") || "").trim() || undefined;
  const doctorOpinion =
    String(formData.get("doctorOpinion") || "").trim() || undefined;
  const notes = String(formData.get("notes") || "").trim() || undefined;

  if (!date || !title) throw new Error("검진일과 제목은 필수입니다");

  const { files: fileBufs, blobUrlsToCleanup } = await collectUploadedFiles(
    formData,
  );

  await createCheckup(
    {
      date,
      subject,
      title,
      hospitalName,
      summary,
      symptoms,
      doctorOpinion,
      notes,
    },
    fileBufs,
  );
  await cleanupBlobs(blobUrlsToCleanup);
  revalidatePath("/checkups");
  redirect("/checkups");
}

export async function updateCheckupAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  const patch: Partial<Checkup> = {
    date: String(formData.get("date") || ""),
    subject: asPerson(formData.get("subject")),
    title: String(formData.get("title") || "").trim(),
    hospitalName: String(formData.get("hospitalName") || "").trim() || undefined,
    summary: String(formData.get("summary") || "").trim(),
    symptoms: String(formData.get("symptoms") || "").trim() || undefined,
    doctorOpinion:
      String(formData.get("doctorOpinion") || "").trim() || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined,
  };

  const { files: fileBufs, blobUrlsToCleanup } = await collectUploadedFiles(
    formData,
  );

  await updateCheckup(year, id, patch, fileBufs);
  await cleanupBlobs(blobUrlsToCleanup);
  revalidatePath(`/checkups/${year}/${id}`);
  revalidatePath("/checkups");
  redirect(`/checkups/${year}/${id}`);
}

export async function deleteCheckupAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  if (!id || !year) throw new Error("id/year 누락");
  await deleteCheckup(year, id);
  revalidatePath("/checkups");
  redirect("/checkups");
}

export async function removeCheckupAttachmentAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const year = String(formData.get("year") || "");
  const path = String(formData.get("path") || "");
  if (!id || !year || !path) throw new Error("id/year/path 누락");
  if (!path.startsWith(`data/checkups/${year}/${id}-files/`)) {
    throw new Error("invalid path");
  }
  await removeCheckupAttachment(year, id, path);
  revalidatePath(`/checkups/${year}/${id}`);
  redirect(`/checkups/${year}/${id}`);
}
