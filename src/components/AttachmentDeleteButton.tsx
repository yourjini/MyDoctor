"use client";

import { useFormStatus } from "react-dom";

export function AttachmentDeleteButton({ filename }: { filename: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${filename} 삭제`}
      className="flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-current"
    >
      {pending ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-spin"
        >
          <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
          <path d="M21 12a9 9 0 0 1-9 9" />
        </svg>
      ) : (
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
      )}
    </button>
  );
}
