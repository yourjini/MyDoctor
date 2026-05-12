"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DiaryLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function lock() {
    setPending(true);
    try {
      await fetch("/api/diary/auth", { method: "DELETE" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={lock}
      disabled={pending}
      className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-60"
      title="다시 잠그기"
    >
      🔒 잠그기
    </button>
  );
}
