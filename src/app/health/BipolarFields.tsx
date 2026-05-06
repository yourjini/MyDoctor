"use client";

import { useState } from "react";
import { TagPicker } from "@/components/TagPicker";
import { PEOPLE, DEFAULT_PERSON } from "@/lib/people";
import { MANIC_TAG_GROUP, MOOD_SCALE_MARKERS } from "@/lib/health-tags";
import { cn } from "@/lib/utils";

const BIPOLAR_SUBJECT = "박란하";

export function BipolarAwareFields({
  defaultSubject,
  defaultMoodScale,
  defaultSleepHours,
  defaultMoodTags,
  defaultMeasuredAt,
}: {
  defaultSubject?: string;
  defaultMoodScale?: number;
  defaultSleepHours?: number;
  defaultMoodTags?: string[];
  defaultMeasuredAt?: string;
}) {
  const [subject, setSubject] = useState(defaultSubject ?? DEFAULT_PERSON);
  const isBipolar = subject === BIPOLAR_SUBJECT;

  return (
    <>
      <select
        name="subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        {PEOPLE.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {isBipolar && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3 space-y-4 mt-2">
          <div className="text-xs font-medium text-rose-900">
            박란하 — 양극성 추적
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                측정시간 (선택)
              </label>
              <input
                type="time"
                name="measuredAt"
                defaultValue={defaultMeasuredAt ?? ""}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <p className="pb-3 text-xs text-muted-foreground">
              아침/저녁 따로 기록할 때 일중 변동을 추적합니다
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              조증/우울 스케일
            </label>
            <MoodScalePicker defaultValue={defaultMoodScale} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">수면시간</label>
            <input
              type="number"
              name="sleepHours"
              defaultValue={defaultSleepHours ?? ""}
              min={0}
              max={24}
              step={0.5}
              placeholder="시간 (예: 6.5)"
              className="w-32 rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              조증 신호 태그
            </label>
            <TagPicker
              name="manicTags"
              groups={[MANIC_TAG_GROUP]}
              defaultValue={
                defaultMoodTags?.filter((t) =>
                  MANIC_TAG_GROUP.tags.includes(t),
                ) ?? []
              }
              selectedClass="bg-orange-500 text-white border-orange-500"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              ↑ 일반 mood 태그와 함께 저장됩니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function MoodScalePicker({ defaultValue }: { defaultValue?: number }) {
  const [value, setValue] = useState<number | undefined>(defaultValue);
  const values = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  return (
    <div>
      <input
        type="hidden"
        name="moodScale"
        value={value === undefined ? "" : String(value)}
      />
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setValue(undefined)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs",
            value === undefined
              ? "bg-foreground text-background"
              : "bg-background hover:bg-accent",
          )}
        >
          —
        </button>
        {values.map((n) => {
          const active = value === n;
          const isMarker = n in MOOD_SCALE_MARKERS;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setValue(n)}
              className={cn(
                "h-8 min-w-[2rem] rounded-md border px-2 text-xs font-medium transition-colors",
                active
                  ? n < 0
                    ? "bg-blue-600 text-white border-blue-600"
                    : n > 0
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-foreground text-background"
                  : "bg-background hover:bg-accent",
                isMarker && !active && "border-foreground/30",
              )}
              title={MOOD_SCALE_MARKERS[n] ?? undefined}
            >
              {n > 0 ? `+${n}` : n}
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>← 우울</span>
        <span>평온</span>
        <span>조증 →</span>
      </div>
    </div>
  );
}
