"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/lib/types";

type Props = {
  attachments: Attachment[];
  // Render an extra slot per item (e.g. delete button when editing).
  itemAccessory?: (a: Attachment) => React.ReactNode;
};

function fileUrl(a: Attachment, download = false): string {
  const base = `/api/file/${a.path}`;
  const params = new URLSearchParams();
  params.set("filename", a.filename);
  if (download) params.set("download", "1");
  return `${base}?${params.toString()}`;
}

function isPdfAttachment(a: Attachment): boolean {
  return (
    a.contentType === "application/pdf" || /\.pdf$/i.test(a.filename)
  );
}

function isAudioAttachment(a: Attachment): boolean {
  return (
    a.contentType.startsWith("audio/") ||
    /\.(mp3|m4a|aac|wav|ogg|oga|webm|3gpp?|amr)$/i.test(a.filename)
  );
}

export function AttachmentGallery({ attachments, itemAccessory }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pdfOpen, setPdfOpen] = useState<Attachment | null>(null);
  const images = attachments.filter((a) => a.contentType.startsWith("image/"));

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight" && openIndex !== null) {
        setOpenIndex((i) => (i === null ? null : Math.min(i + 1, images.length - 1)));
      }
      if (e.key === "ArrowLeft" && openIndex !== null) {
        setOpenIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openIndex, images.length]);

  function openImage(a: Attachment) {
    const idx = images.findIndex((img) => img.path === a.path);
    if (idx >= 0) setOpenIndex(idx);
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {attachments.map((a) => {
          const isImage = a.contentType.startsWith("image/");
          return (
            <li key={a.path} className="relative rounded-md border p-2">
              {isImage ? (
                <button
                  type="button"
                  onClick={() => openImage(a)}
                  className="block w-full text-left"
                  aria-label={`${a.filename} 크게 보기`}
                >
                  <img
                    src={fileUrl(a)}
                    alt={a.filename}
                    className="h-32 w-full rounded object-cover"
                  />
                  <div className="mt-1 truncate text-xs">{a.filename}</div>
                </button>
              ) : isPdfAttachment(a) ? (
                <button
                  type="button"
                  onClick={() => setPdfOpen(a)}
                  className="block w-full text-left"
                  aria-label={`${a.filename} 미리보기`}
                >
                  <div className="flex h-32 items-center justify-center rounded bg-muted text-3xl">
                    📄
                  </div>
                  <div className="mt-1 truncate text-xs">{a.filename}</div>
                </button>
              ) : isAudioAttachment(a) ? (
                <div>
                  <div className="flex h-32 flex-col items-center justify-center gap-2 rounded bg-muted p-2 text-center">
                    <div className="text-3xl">🎙️</div>
                    <audio
                      src={fileUrl(a)}
                      controls
                      preload="metadata"
                      className="w-full max-w-full"
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{a.filename}</span>
                    <a
                      href={fileUrl(a, true)}
                      download={a.filename}
                      className="shrink-0 text-muted-foreground underline-offset-2 hover:underline"
                      aria-label={`${a.filename} 다운로드`}
                    >
                      ⬇︎
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  href={fileUrl(a)}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <div className="flex h-32 items-center justify-center rounded bg-muted text-3xl">
                    📎
                  </div>
                  <div className="mt-1 truncate text-xs">{a.filename}</div>
                </a>
              )}
              {itemAccessory?.(a)}
            </li>
          );
        })}
      </ul>

      {openIndex !== null && images[openIndex] && (
        <Lightbox
          images={images}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onPrev={() => setOpenIndex((i) => (i === null ? null : Math.max(i - 1, 0)))}
          onNext={() =>
            setOpenIndex((i) =>
              i === null ? null : Math.min(i + 1, images.length - 1),
            )
          }
        />
      )}

      {pdfOpen && (
        <PdfModal attachment={pdfOpen} onClose={() => setPdfOpen(null)} />
      )}
    </>
  );
}

function PdfModal({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const previewSrc = fileUrl(attachment) + "#toolbar=0&navpanes=0";
  const downloadHref = fileUrl(attachment, true);
  const openHref = fileUrl(attachment);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-black/85"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-3 py-2 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1 truncate text-sm">
          {attachment.filename}
        </div>
        <a
          href={downloadHref}
          download={attachment.filename}
          className="rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
        >
          다운로드
        </a>
        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
        >
          새 탭
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="rounded bg-white/10 p-1.5 hover:bg-white/20"
        >
          <CloseIcon />
        </button>
      </div>
      <div
        className="flex-1 overflow-hidden bg-neutral-900 p-2 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={previewSrc}
          title={attachment.filename}
          className="h-full w-full rounded bg-white"
        />
        <p className="mt-2 text-center text-xs text-white/60 sm:hidden">
          모바일에서 미리보기가 안 보이면 위 &quot;새 탭&quot; 또는 &quot;다운로드&quot;를 사용하세요.
        </p>
      </div>
    </div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: Attachment[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const a = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  // 모바일 스와이프: 가로 50px 이상, 세로 변위보다 큼 → 좌/우 전환.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && hasNext) onNext();
    else if (dx > 0 && hasPrev) onPrev();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-2 sm:p-6"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
      >
        <CloseIcon />
      </button>

      <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded bg-black/40 px-3 py-1 text-xs text-white">
        {a.filename} · {index + 1} / {images.length}
      </div>

      <div
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={fileUrl(a, true)}
          download={a.filename}
          className="rounded bg-black/40 px-3 py-1.5 text-xs text-white hover:bg-black/60"
        >
          다운로드
        </a>
        <a
          href={fileUrl(a)}
          target="_blank"
          rel="noreferrer"
          className="rounded bg-black/40 px-3 py-1.5 text-xs text-white hover:bg-black/60"
        >
          새 탭
        </a>
      </div>

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="이전"
          className="absolute left-2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 sm:left-4"
        >
          <ArrowIcon dir="left" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="다음"
          className="absolute right-2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 sm:right-4"
        >
          <ArrowIcon dir="right" />
        </button>
      )}

      <img
        src={fileUrl(a)}
        alt={a.filename}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "max-h-[92vh] max-w-[96vw] rounded object-contain shadow-xl",
        )}
      />
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
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
  );
}

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: dir === "right" ? "rotate(180deg)" : undefined }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
