"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DiaryLockScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/diary/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else if (res.status === 401) {
        setError("비밀번호가 맞지 않습니다.");
      } else {
        setError("잠금 해제 실패. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden className="text-2xl">🔒</span>
        <div>
          <h2 className="text-base font-semibold">다이어리 잠금</h2>
          <p className="text-xs text-muted-foreground">
            별도 비밀번호가 필요합니다
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="다이어리 비밀번호"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          autoComplete="current-password"
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={pending || !password}
          className="w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "확인 중…" : "잠금 해제"}
        </button>
      </form>
      <p className="mt-4 text-[11px] text-muted-foreground">
        잠금은 7일 동안 유지됩니다. 환경변수 <code>DIARY_PASSWORD</code>로 설정.
      </p>
    </div>
  );
}
