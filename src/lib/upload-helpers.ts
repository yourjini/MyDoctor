// Shared Blob + HEIC + direct multipart file collection helper for
// server actions. Centralizes the "small files via FormData, big files via
// Vercel Blob" pattern so each record kind (visits/checkups/…) doesn't
// re-implement it.

import "server-only";

import { del as deleteBlob, get as getBlob } from "@vercel/blob";
import { heicToJpeg, isHeic, jpegFilenameFor } from "./images";

export type FileBuf = { filename: string; contentType: string; data: Buffer };

type BlobRef = {
  url: string;
  filename: string;
  contentType: string;
  size: number;
};

export type CollectedUploads = {
  files: FileBuf[];
  blobUrlsToCleanup: string[];
};

export async function collectUploadedFiles(
  formData: FormData,
): Promise<CollectedUploads> {
  const out: FileBuf[] = [];
  const blobUrlsToCleanup: string[] = [];

  // (a) 작은 파일: FormData 멀티파트로 직접 들어옴
  const directFiles = formData.getAll("files") as File[];
  for (const f of directFiles) {
    if (!(f instanceof File) || f.size === 0) continue;
    out.push(
      await convertFileBuf(f.name, f.type, Buffer.from(await f.arrayBuffer())),
    );
  }

  // (b) 큰 파일: 브라우저가 Vercel Blob 에 직업로드 후 URL 만 FormData 로 전달
  const blobUrlsRaw = String(formData.get("blob_urls") || "").trim();
  if (blobUrlsRaw) {
    let blobs: BlobRef[] = [];
    try {
      blobs = JSON.parse(blobUrlsRaw) as BlobRef[];
    } catch {
      throw new Error("blob_urls 파싱 실패");
    }
    for (const b of blobs) {
      if (typeof b?.url !== "string" || !isAllowedBlobUrl(b.url)) {
        throw new Error("올바르지 않은 Blob URL");
      }
      const got = await getBlob(b.url, { access: "private" });
      if (!got || got.statusCode !== 200) {
        throw new Error(
          `Blob 다운로드 실패 (${b.filename}): ${got?.statusCode ?? "not found"}`,
        );
      }
      const buf = Buffer.from(await new Response(got.stream).arrayBuffer());
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

function isAllowedBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// 실패해도 메인 흐름을 막지 않음 — 임시 Blob은 TTL로도 정리되지만
// 가능한 한 즉시 비운다.
export async function cleanupBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
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
