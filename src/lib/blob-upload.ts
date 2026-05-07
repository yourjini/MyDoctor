"use client";

import { upload } from "@vercel/blob/client";

export type UploadedBlob = {
  url: string;
  filename: string;
  contentType: string;
  size: number;
};

export async function uploadFileToBlob(
  file: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<UploadedBlob> {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
    onUploadProgress: (e) => {
      if (onProgress) onProgress(e.loaded, e.total);
    },
  });
  return {
    url: blob.url,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  };
}
