"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
  className?: string;
  // 사용자가 파일을 추가할 때 가공 (PDF → JPEG 변환 등). 비동기 가능.
  // 진행 중에는 picker가 disabled되고 progressLabel이 표시됨.
  transformOnAdd?: (
    incoming: File[],
    setProgress: (label: string | null) => void,
  ) => Promise<File[]>;
};

export function FilePicker({
  name,
  accept = "image/*,application/pdf",
  multiple = true,
  onChange,
  className,
  transformOnAdd,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Map<File, string>>(new Map());
  const [busy, setBusy] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const visibleRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]);
  filesRef.current = files;

  useEffect(() => {
    const next = new Map<File, string>();
    for (const f of files) {
      if (f.type.startsWith("image/")) {
        next.set(f, URL.createObjectURL(f));
      }
    }
    setPreviews((prev) => {
      for (const [f, url] of prev) {
        if (!next.has(f)) URL.revokeObjectURL(url);
      }
      return next;
    });
    return () => {
      for (const url of next.values()) URL.revokeObjectURL(url);
    };
  }, [files]);

  function syncHiddenInput() {
    const input = hiddenRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    for (const f of filesRef.current) dt.items.add(f);
    input.files = dt.files;
  }

  useEffect(() => {
    syncHiddenInput();
  }, [files]);

  useEffect(() => {
    const input = hiddenRef.current;
    const form = input?.form;
    if (!form) return;
    const handler = () => syncHiddenInput();
    form.addEventListener("submit", handler, true);
    return () => form.removeEventListener("submit", handler, true);
  }, []);

  useEffect(() => {
    onChange?.(files);
  }, [files, onChange]);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    let incoming = Array.from(list);
    if (transformOnAdd && incoming.length > 0) {
      setBusy(true);
      try {
        incoming = await transformOnAdd(incoming, setProgressLabel);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setProgressLabel(`변환 실패: ${msg}`);
        setBusy(false);
        if (visibleRef.current) visibleRef.current.value = "";
        return;
      }
      setBusy(false);
      setProgressLabel(null);
    }
    setFiles((prev) => {
      if (!multiple) return incoming.slice(0, 1);
      const seen = new Set(prev.map(keyOf));
      const merged = [...prev];
      for (const f of incoming) {
        if (!seen.has(keyOf(f))) merged.push(f);
      }
      return merged;
    });
    if (visibleRef.current) visibleRef.current.value = "";
  }

  function remove(target: File) {
    setFiles((prev) => prev.filter((f) => f !== target));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={hiddenRef}
        type="file"
        name={name}
        multiple={multiple}
        accept={accept}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => visibleRef.current?.click()}
          disabled={busy}
          className="rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:cursor-wait disabled:opacity-60"
        >
          + 파일 선택
        </button>
        <span className="text-xs text-muted-foreground">
          {busy
            ? progressLabel || "처리 중…"
            : files.length > 0
              ? `${files.length}개 파일 선택됨`
              : "이미지 또는 PDF"}
        </span>
        <input
          ref={visibleRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((f) => (
            <li
              key={keyOf(f)}
              className="relative rounded-md border p-2"
            >
              {f.type.startsWith("image/") ? (
                <img
                  src={previews.get(f)}
                  alt={f.name}
                  className="h-24 w-full rounded object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center rounded bg-muted text-3xl">
                  📄
                </div>
              )}
              <div className="mt-1 truncate text-xs" title={f.name}>
                {f.name}
              </div>
              <button
                type="button"
                onClick={() => remove(f)}
                aria-label={`${f.name} 제거`}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-destructive hover:text-destructive-foreground"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function keyOf(f: File): string {
  return `${f.name}|${f.size}|${f.lastModified}`;
}
