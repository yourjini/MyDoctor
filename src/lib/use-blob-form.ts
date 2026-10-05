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

import { useRef, useState, useEffect } from "react";
import { uploadFileToBlob, type UploadedBlob } from "./blob-upload";

const WATCHDOG_MS = 60000;

export function useBlobUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const blobUrlsRef = useRef<HTMLInputElement>(null);
  // "이번 submit 흐름 내에서 두 번째 submit event 를 그냥 통과시켜라" 플래그.
  // 두 번째 onSubmit 에서 바로 false 로 리셋됨.
  const readyRef = useRef(false);
  // "서버 응답을 기다리는 중" 플래그 — watchdog 이 사용. uploading state 와
  // 분리된 이유: setState 는 비동기라 setTimeout 콜백이 stale 값을 봄.
  const waitingRef = useRef(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 성공 시 redirect 로 unmount — watchdog 자동 정리.
  useEffect(() => {
    return () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, []);

  function resetWaiting() {
    waitingRef.current = false;
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (readyRef.current) {
      // Blob 업로드 끝나고 두 번째로 들어온 submit — 그대로 액션에 넘김.
      // waitingRef 는 그대로 true 유지 (서버 응답 기다리는 중).
      readyRef.current = false;
      return;
    }
    e.preventDefault();
    if (waitingRef.current) return;

    setError(null);
    setUploading(true);
    setProgress(null);
    waitingRef.current = true;

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

      // Watchdog — 서버 액션이 60s 안에 응답 안 하면 (타임아웃/hang)
      // "업로드 중" 상태를 풀고 에러 노출. 성공 (redirect) 시엔 컴포넌트가
      // 언마운트되면서 useEffect cleanup 이 타이머를 지움.
      watchdogRef.current = setTimeout(() => {
        if (!waitingRef.current) return;
        waitingRef.current = false;
        watchdogRef.current = null;
        setUploading(false);
        setProgress(null);
        setError(
          "저장 응답이 60초 안에 돌아오지 않았습니다. 네트워크/서버 상태 확인 후 다시 시도해주세요. 이미 저장됐을 수도 있으니 목록도 한번 봐주세요.",
        );
      }, WATCHDOG_MS);

      // 두 번째 submit 유발 — 브라우저가 네이티브 submit 로 진행
      formRef.current?.requestSubmit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "업로드 실패";
      setError(msg);
      setUploading(false);
      setProgress(null);
      readyRef.current = false;
      resetWaiting();
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
