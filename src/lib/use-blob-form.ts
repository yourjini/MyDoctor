"use client";

// Blob 업로드 폼 공통 훅. CheckupForm / VisitForm / VisitEdit 등에서 같은
// "파일 → Blob 업로드 → 서버 액션 호출" 패턴을 공유.
//
// 왜 form action 대신 직접 액션 호출?
//   requestSubmit() 로 두 번째 submit 이벤트를 유발해 React 가 form action
//   을 실행하도록 유도하던 이전 방식은, React 19 + Next.js 16 조합에서
//   간헐적으로 두 번째 submit 이 서버 액션으로 이어지지 않는 문제를 유발.
//   그래서 액션을 훅의 인자로 받아 FormData 를 직접 넘겨 호출.
//   useTransition 으로 pending 상태를 React 가 추적, 에러도 try/catch.
//
// 사용:
//   const blob = useBlobUploadForm(createVisitAction);
//   <form ref={blob.formRef} onSubmit={blob.onSubmit}>
//     <input type="hidden" name="blob_urls" ref={blob.blobUrlsRef} />
//     <FilePicker onChange={blob.setFiles} disabled={blob.uploading} />
//     {blob.progress && <p>{blob.progress}</p>}
//     {blob.error && <p className="text-destructive">{blob.error}</p>}
//     <button disabled={blob.uploading}>저장</button>
//   </form>

import { useRef, useState, useTransition } from "react";
import { uploadFileToBlob, type UploadedBlob } from "./blob-upload";

export function useBlobUploadForm(
  action: (formData: FormData) => void | Promise<void>,
) {
  const formRef = useRef<HTMLFormElement>(null);
  const blobUrlsRef = useRef<HTMLInputElement>(null);
  // 중복 submit 가드. actionPending 과 분리된 이유: Blob 업로드 중 (아직
  // startTransition 진입 전) 에도 재submit 을 막아야 함.
  const inFlightRef = useRef(false);

  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, startTransition] = useTransition();

  const uploading = actionPending || progress !== null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlightRef.current || actionPending) return;
    inFlightRef.current = true;
    setError(null);

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

      const form = formRef.current;
      if (!form) throw new Error("폼을 찾을 수 없습니다");
      // FormData 는 form 의 현재 DOM 상태를 스냅샷. blob_urls 는 바로 위에서
      // 세팅했으므로 포함됨.
      const fd = new FormData(form);

      setProgress("저장 중…");

      startTransition(async () => {
        try {
          await action(fd);
          // redirect() 하는 액션이면 여기 도달 전에 네비게이션 시작.
          // 네비게이션 없이 끝난 경우를 위해 UI 초기화.
          setProgress(null);
          inFlightRef.current = false;
        } catch (err) {
          // Next.js 내부 redirect/notFound — 재throw 해서 Next 가 처리.
          const digest = (err as { digest?: unknown } | null | undefined)
            ?.digest;
          if (
            typeof digest === "string" &&
            (digest.startsWith("NEXT_REDIRECT") ||
              digest.startsWith("NEXT_NOT_FOUND"))
          ) {
            throw err;
          }
          const msg = err instanceof Error ? err.message : "저장 실패";
          setError(msg);
          setProgress(null);
          inFlightRef.current = false;
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      setError(msg);
      setProgress(null);
      inFlightRef.current = false;
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
