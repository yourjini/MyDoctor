"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/lib/types";

type Props = {
  attachments: Attachment[];
  // Render an extra slot per item (e.g. delete button when editing).
  itemAccessory?: (a: Attachment) => React.ReactNode;
};

export function AttachmentGallery({ attachments, itemAccessory }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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
                    src={`/api/file/${a.path}`}
                    alt={a.filename}
                    className="h-32 w-full rounded object-cover"
                  />
                  <div className="mt-1 truncate text-xs">{a.filename}</div>
                </button>
              ) : (
                <a
                  href={`/api/file/${a.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <div className="flex h-32 items-center justify-center rounded bg-muted text-3xl">
                    📄
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
    </>
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
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-2 sm:p-6"
      onClick={onClose}
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

      <a
        href={`/api/file/${a.path}`}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded bg-black/40 px-3 py-1.5 text-xs text-white hover:bg-black/60"
      >
        새 탭에서 열기
      </a>

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
        src={`/api/file/${a.path}`}
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
