"use client";

// Blob 업로드 폼 공통 훅. CheckupForm / VisitForm / VisitEdit 등에서 같은
// 2단계 submit 패턴 (파일 → Blob 업로드 → form 액션 재제출) 을 공유.
//
// 사용:
//   const blob = useBlobUploadForm();
//   <form ref={blob.formRef} action={serverAction} onSubmit={blob.onSubmit}>
//     <input type="hidden" name="blob_urls" ref={blob.blobUrlsRef} />
//     <FilePicker onChange={blob.setFiles} disabled={blob.uploading} />
//     {blob.progress && <p>{blob.progress}</p>}
//     {blob.error && <p className="text-destructive">{blob.error}</p>}
//     <button disabled={blob.uploading}>저장</button>
//   </form>

import { useRef, useState } from "react";
import { uploadFileToBlob, type UploadedBlob } from "./blob-upload";

export function useBlobUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const blobUrlsRef = useRef<HTMLInputElement>(null);
  const readyRef = useRef(false);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (readyRef.current) {
      // Blob 업로드 끝나고 두 번째로 들어온 submit — 그대로 액션에 넘김
      readyRef.current = false;
      return;
    }
    e.preventDefault();
    if (uploading) return;

    setError(null);
    setUploading(true);
    setProgress(null);

    try {
      const blobs: UploadedBlob[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(
          `${i + 1}/${files.length} ${f.name} 업로드 중… (${formatBytes(f.size)})`,
        );
        const b = await uploadFileToBlob(f, (loaded, total) => {
          if (total) {
            const pct = Math.round((loaded / total) * 100);
            setProgress(`${i + 1}/${files.length} ${f.name} ${pct}%`);
          }
        });
        blobs.push(b);
      }
      if (blobUrlsRef.current) {
        blobUrlsRef.current.value = JSON.stringify(blobs);
      }
      setProgress("저장 중…");
      readyRef.current = true;
      formRef.current?.requestSubmit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      setError(msg);
      setUploading(false);
      setProgress(null);
    }
  }

  return {
    formRef,
    blobUrlsRef,
    files,
    setFiles,
    uploading,
    progress,
    error,
    onSubmit,
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
