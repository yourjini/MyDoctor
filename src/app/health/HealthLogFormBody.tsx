"use client";

import { useState } from "react";
import { TagPicker } from "@/components/TagPicker";
import { PEOPLE } from "@/lib/people";
import {
  ATTENDANCE_TAG_GROUP,
  ATTENDANCE_TAGS,
  BIPOLAR_SIGNAL_TAGS,
  BODY_TAG_GROUPS,
  DEPRESSIVE_TAG_GROUP,
  DEPRESSIVE_TAGS,
  MANIC_TAG_GROUP,
  MANIC_TAGS,
  MENSTRUATION_LABEL,
  MOOD_SCALE_MARKERS,
  MOOD_TAG_GROUPS,
  SEVERITY_LABEL,
} from "@/lib/health-tags";
import { cn } from "@/lib/utils";
import type { HealthLog, MenstruationFlow } from "@/lib/types";

const BIPOLAR_SUBJECT = "박란하";
const DEFAULT_SUBJECT = "박란하"; // 80% 사용 패턴 — 진입 시 박란하

export function HealthLogFormBody({
  defaultDate,
  defaultSubject,
  defaultSeverity,
  defaultBodyTags,
  defaultMoodTags,
  defaultMenstruation,
  defaultNote,
  defaultMoodScale,
  defaultSleepHours,
  defaultWeight,
  defaultMeasuredAt,
  latestBipolarWeight,
}: {
  defaultDate: string;
  defaultSubject?: string;
  defaultSeverity?: number;
  defaultBodyTags?: string[];
  defaultMoodTags?: string[];
  defaultMenstruation?: MenstruationFlow;
  defaultNote?: string;
  defaultMoodScale?: number;
  defaultSleepHours?: number;
  defaultWeight?: number;
  defaultMeasuredAt?: string;
  latestBipolarWeight?: number;
}) {
  const [subject, setSubject] = useState(defaultSubject ?? DEFAULT_SUBJECT);
  const isBipolar = subject === BIPOLAR_SUBJECT;

  const manicDefault = defaultMoodTags?.filter((t) => MANIC_TAGS.has(t)) ?? [];
  const depressiveDefault =
    defaultMoodTags?.filter((t) => DEPRESSIVE_TAGS.has(t)) ?? [];
  const attendanceDefault =
    defaultMoodTags?.filter((t) => ATTENDANCE_TAGS.has(t)) ?? [];
  const generalMoodDefault =
    defaultMoodTags?.filter((t) => !BIPOLAR_SIGNAL_TAGS.has(t)) ?? [];

  // 양극성 박스의 "자세히"는 기존 값이 있을 때만 펼침 — 매일 입력 인지 부하 줄이기
  const bipolarDetailsHasData =
    !!defaultSleepHours ||
    !!defaultWeight ||
    !!defaultMeasuredAt ||
    manicDefault.length > 0 ||
    depressiveDefault.length > 0 ||
    attendanceDefault.length > 0;

  return (
    <div className="space-y-4">
      {/* ───── 날짜 + 대상자 ───── */}
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

      {/* ───── 박란하 양극성 박스 ───── */}
      {isBipolar && (
        <BipolarBox
          defaultMoodScale={defaultMoodScale}
          defaultSleepHours={defaultSleepHours}
          defaultWeight={defaultWeight}
          defaultMeasuredAt={defaultMeasuredAt}
          manicDefault={manicDefault}
          depressiveDefault={depressiveDefault}
          attendanceDefault={attendanceDefault}
          latestBipolarWeight={latestBipolarWeight}
          detailsOpen={bipolarDetailsHasData}
        />
      )}

      {/* ───── 컨디션 ───── */}
      <Field label="컨디션 (전체)">
        <SeverityRadios defaultValue={defaultSeverity} />
      </Field>

      {/* ───── 신체 태그 ───── */}
      <CollapsibleField
        label="아픈 곳 / 증상"
        defaultOpen={(defaultBodyTags?.length ?? 0) > 0}
      >
        <TagPicker
          name="bodyTags"
          groups={BODY_TAG_GROUPS}
          defaultValue={defaultBodyTags}
          selectedClass="bg-slate-700 text-white border-slate-700"
        />
      </CollapsibleField>

      {/* ───── 기분 태그 — 박란하면 숨김 (양극성 박스와 중복) ───── */}
      {!isBipolar && (
        <CollapsibleField
          label="기분 / 심리"
          defaultOpen={generalMoodDefault.length > 0}
        >
          <TagPicker
            name="moodTags"
            groups={MOOD_TAG_GROUPS}
            defaultValue={generalMoodDefault}
            selectedClass="bg-indigo-500 text-white border-indigo-500"
          />
        </CollapsibleField>
      )}

      {/* ───── 생리 ───── */}
      <Field label="생리">
        <MenstruationRadios defaultValue={defaultMenstruation} />
      </Field>

      {/* ───── 메모 ───── */}
      <Field label="메모">
        <textarea
          name="note"
          rows={3}
          defaultValue={defaultNote ?? ""}
          placeholder="짧게 한 줄도 좋아요"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>
    </div>
  );
}

// ============================================================
// 박란하 양극성 박스 — moodScale만 디폴트 노출, 나머지는 details
// ============================================================

function BipolarBox({
  defaultMoodScale,
  defaultSleepHours,
  defaultWeight,
  defaultMeasuredAt,
  manicDefault,
  depressiveDefault,
  attendanceDefault,
  latestBipolarWeight,
  detailsOpen,
}: {
  defaultMoodScale?: number;
  defaultSleepHours?: number;
  defaultWeight?: number;
  defaultMeasuredAt?: string;
  manicDefault: string[];
  depressiveDefault: string[];
  attendanceDefault: string[];
  latestBipolarWeight?: number;
  detailsOpen: boolean;
}) {
  return (
    <div className="rounded-lg border border-pink-200 bg-pink-50/30 p-3 sm:p-4 space-y-3">
      <div className="text-xs font-medium text-pink-900">
        박란하 — 양극성 추적
      </div>

      {/* 항상 보이는 한 가지: moodScale */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          오늘 기분
        </label>
        <MoodScalePicker defaultValue={defaultMoodScale} />
      </div>

      {/* 나머지는 접기 — 기록이 없으면 닫힌 상태 */}
      <details className="group rounded-md border bg-background" open={detailsOpen}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium hover:bg-accent/50">
          <span>자세히 (수면·체중·신호·출결)</span>
          <span className="text-muted-foreground group-open:hidden">펼치기 ▾</span>
          <span className="hidden text-muted-foreground group-open:inline">접기 ▴</span>
        </summary>
        <div className="space-y-4 border-t p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                측정시간 <span className="text-[10px] text-muted-foreground">(선택)</span>
              </label>
              <input
                type="time"
                name="measuredAt"
                defaultValue={defaultMeasuredAt ?? ""}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                수면시간 <span className="text-[10px] text-muted-foreground">(선택)</span>
              </label>
              <input
                type="number"
                name="sleepHours"
                defaultValue={defaultSleepHours ?? ""}
                min={0}
                max={24}
                step={0.5}
                placeholder="예: 6.5"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                체중 <span className="text-[10px] text-muted-foreground">(kg, 선택)</span>
              </label>
              <input
                type="number"
                name="weight"
                defaultValue={defaultWeight ?? ""}
                min={20}
                max={300}
                step={0.1}
                placeholder={
                  latestBipolarWeight != null
                    ? `최근 ${latestBipolarWeight}kg`
                    : "kg"
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">조증 신호</label>
              <TagPicker
                name="manicTags"
                groups={[MANIC_TAG_GROUP]}
                defaultValue={manicDefault}
                selectedClass="bg-orange-500 text-white border-orange-500"
                hideGroupLabel
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">우울 신호</label>
              <TagPicker
                name="depressiveTags"
                groups={[DEPRESSIVE_TAG_GROUP]}
                defaultValue={depressiveDefault}
                selectedClass="bg-blue-600 text-white border-blue-600"
                hideGroupLabel
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">출결 (학교)</label>
            <TagPicker
              name="attendanceTags"
              groups={[ATTENDANCE_TAG_GROUP]}
              defaultValue={attendanceDefault}
              selectedClass="bg-red-600 text-white border-red-600"
              hideGroupLabel
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            신호 태그·출결은 기분 태그와 함께 저장됩니다.
          </p>
        </div>
      </details>
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

// ============================================================
// 공용 폼 컨트롤
// ============================================================

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function CollapsibleField({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-md border bg-background"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium hover:bg-accent/50">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground group-open:hidden">
          펼치기 ▾
        </span>
        <span className="hidden text-xs text-muted-foreground group-open:inline">
          접기 ▴
        </span>
      </summary>
      <div className="border-t p-3">{children}</div>
    </details>
  );
}

function SeverityRadios({ defaultValue }: { defaultValue?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <RadioPill
        name="severity"
        value=""
        label="—"
        defaultChecked={!defaultValue}
      />
      {[1, 2, 3, 4, 5].map((n) => (
        <RadioPill
          key={n}
          name="severity"
          value={String(n)}
          label={`${n} ${SEVERITY_LABEL[n]}`}
          defaultChecked={defaultValue === n}
        />
      ))}
    </div>
  );
}

function MenstruationRadios({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <RadioPill
        name="menstruation"
        value=""
        label="해당없음"
        defaultChecked={!defaultValue}
      />
      {(["light", "normal", "heavy"] as const).map((v) => (
        <RadioPill
          key={v}
          name="menstruation"
          value={v}
          label={MENSTRUATION_LABEL[v]}
          defaultChecked={defaultValue === v}
        />
      ))}
    </div>
  );
}

function RadioPill({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-accent peer-checked:border-pink-500 peer-checked:bg-pink-500 peer-checked:text-white">
        {label}
      </span>
    </label>
  );
}
