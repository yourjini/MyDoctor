"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type TagGroup = { label: string; tags: string[] };

export function TagPicker({
  name,
  groups,
  defaultValue = [],
  selectedClass = "bg-rose-500 text-white border-rose-500",
  unselectedClass = "bg-background text-foreground border-border hover:bg-accent",
  placeholder = "직접 입력하고 Enter",
}: {
  name: string;
  groups: TagGroup[];
  defaultValue?: string[];
  selectedClass?: string;
  unselectedClass?: string;
  placeholder?: string;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    Array.from(new Set(defaultValue)),
  );
  const [draft, setDraft] = useState("");

  const presetTags = useMemo(
    () => new Set(groups.flatMap((g) => g.tags)),
    [groups],
  );

  function toggle(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function commitDraft() {
    const v = draft.trim();
    if (!v) return;
    if (!selected.includes(v)) setSelected((prev) => [...prev, v]);
    setDraft("");
  }

  const customSelected = selected.filter((t) => !presetTags.has(t));

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={selected.join(",")} />

      {groups.map((g) => (
        <div key={g.label}>
          <div className="mb-1 text-xs text-muted-foreground">{g.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {g.tags.map((tag) => {
              const on = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    on ? selectedClass : unselectedClass,
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {customSelected.length > 0 && (
        <div>
          <div className="mb-1 text-xs text-muted-foreground">직접 추가</div>
          <div className="flex flex-wrap gap-1.5">
            {customSelected.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  selectedClass,
                )}
                title="클릭해서 제거"
              >
                {tag} ×
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={commitDraft}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          추가
        </button>
      </div>
    </div>
  );
}
