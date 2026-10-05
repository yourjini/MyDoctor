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

      // Watchdog — 60초 안에 페이지 전환이 안 일어나면 (서버 액션 실패/
      // 타임아웃/hang) 사용자가 영원히 "업로드 중" 상태로 멈추는 걸 막음.
      // 성공 시 redirect() 로 페이지가 바뀌면 컴포넌트가 언마운트돼 이 타이머
      // 는 실행되지 않음.
      setTimeout(() => {
        if (readyRef.current) {
          // readyRef 가 아직 true 면 submit 가 끝났어야 할 상황인데 안 끝난 것
          readyRef.current = false;
          setUploading(false);
          setProgress(null);
          setError(
            "저장 응답이 60초 안에 돌아오지 않았습니다. 네트워크/서버 상태 확인 후 다시 시도해주세요. (이미 저장됐을 수도 있으니 목록도 한번 봐주세요)",
          );
        }
      }, 60000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      setError(msg);
      setUploading(false);
      setProgress(null);
      readyRef.current = false;
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
