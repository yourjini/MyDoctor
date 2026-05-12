"use client";

import { useState } from "react";
import { TagPicker } from "@/components/TagPicker";
import { PEOPLE, DEFAULT_PERSON } from "@/lib/people";
import {
  MANIC_TAG_GROUP,
  DEPRESSIVE_TAG_GROUP,
  ATTENDANCE_TAG_GROUP,
  MANIC_TAGS,
  DEPRESSIVE_TAGS,
  ATTENDANCE_TAGS,
  MOOD_SCALE_MARKERS,
} from "@/lib/health-tags";
import { cn } from "@/lib/utils";

const BIPOLAR_SUBJECT = "박란하";

export function BipolarAwareFields({
  defaultDate,
  defaultSubject,
  defaultMoodScale,
  defaultSleepHours,
  defaultWeight,
  defaultMoodTags,
  defaultMeasuredAt,
}: {
  defaultDate: string;
  defaultSubject?: string;
  defaultMoodScale?: number;
  defaultSleepHours?: number;
  defaultWeight?: number;
  defaultMoodTags?: string[];
  defaultMeasuredAt?: string;
}) {
  const [subject, setSubject] = useState(defaultSubject ?? DEFAULT_PERSON);
  const isBipolar = subject === BIPOLAR_SUBJECT;

  const manicDefault =
    defaultMoodTags?.filter((t) => MANIC_TAGS.has(t)) ?? [];
  const depressiveDefault =
    defaultMoodTags?.filter((t) => DEPRESSIVE_TAGS.has(t)) ?? [];
  const attendanceDefault =
    defaultMoodTags?.filter((t) => ATTENDANCE_TAGS.has(t)) ?? [];

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            날짜<span className="ml-0.5 text-destructive">*</span>
          </label>
          <input
            type="date"
            name="date"
            defaultValue={defaultDate}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            대상자<span className="ml-0.5 text-destructive">*</span>
          </label>
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
        </div>
      </div>

      {isBipolar && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3 sm:p-4 space-y-4">
          <div className="text-xs font-medium text-rose-900">
            박란하 — 양극성 추적
          </div>

          {/* 숫자 입력들: 측정시간 / 수면 / 체중 — 한 줄로 */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                측정시간 <span className="text-xs text-muted-foreground">(선택)</span>
              </label>
              <input
                type="time"
                name="measuredAt"
                defaultValue={defaultMeasuredAt ?? ""}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
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
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                체중 <span className="text-xs text-muted-foreground">(kg)</span>
              </label>
              <input
                type="number"
                name="weight"
                defaultValue={defaultWeight ?? ""}
                min={0}
                max={300}
                step={0.1}
                placeholder="kg (예: 58.4)"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* 조증/우울 스케일 — 전체 너비 */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              조증/우울 스케일
            </label>
            <MoodScalePicker defaultValue={defaultMoodScale} />
          </div>

          {/* 신호 태그들: 좌우 — sm 이상에서 2열 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                조증 신호
              </label>
              <TagPicker
                name="manicTags"
                groups={[MANIC_TAG_GROUP]}
                defaultValue={manicDefault}
                selectedClass="bg-orange-500 text-white border-orange-500"
                hideGroupLabel
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                우울 신호
              </label>
              <TagPicker
                name="depressiveTags"
                groups={[DEPRESSIVE_TAG_GROUP]}
                defaultValue={depressiveDefault}
                selectedClass="bg-blue-600 text-white border-blue-600"
                hideGroupLabel
              />
            </div>
          </div>

          {/* 출결 — 전체 너비, 가로 배치 */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              출결 (학교)
            </label>
            <TagPicker
              name="attendanceTags"
              groups={[ATTENDANCE_TAG_GROUP]}
              defaultValue={attendanceDefault}
              selectedClass="bg-rose-600 text-white border-rose-600"
              hideGroupLabel
            />
          </div>

          <p className="text-xs text-muted-foreground">
            신호 태그·출결은 기분 태그와 함께 저장됩니다.
          </p>
        </div>
      )}
    </div>
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
