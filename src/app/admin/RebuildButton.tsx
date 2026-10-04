"use client";

import { useState, useTransition } from "react";
import { rebuildAllManifestsAction, type RebuildResult } from "./actions";

export function RebuildButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RebuildResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await rebuildAllManifestsAction();
        setResult(r);
      } catch (err) {
        setError(err instanceof Error ? err.message : "실패");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "재구성 중…" : "모든 매니페스트 재구성"}
      </button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="rounded-md border bg-background p-3 text-sm">
          <div className="mb-2 font-medium text-emerald-700">완료</div>
          <ul className="space-y-0.5 text-muted-foreground">
            {result.map((r) => (
              <li key={r.kind}>
                <code className="text-xs">{r.kind}</code>: {r.count} 건
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
