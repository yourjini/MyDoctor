"use client";

import { useRef, useState } from "react";
import { TagPicker } from "@/components/TagPicker";
import {
  BODY_TAG_GROUPS,
  MENSTRUATION_LABEL,
  MOOD_TAG_GROUPS,
  SEVERITY_LABEL,
  BIPOLAR_SIGNAL_TAGS,
  MANIC_TAGS,
  DEPRESSIVE_TAGS,
  ATTENDANCE_TAGS,
} from "@/lib/health-tags";
import { updateHealthLogAction } from "../../actions";
import type { HealthLog } from "@/lib/types";
import { BipolarAwareFields } from "../../BipolarFields";

export function HealthEditView({
  log,
  year,
}: {
  log: HealthLog;
  year: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function cancel() {
    formRef.current?.reset();
    setIsEditing(false);
  }

  if (!isEditing) {
    return <ReadOnlyView log={log} onEdit={() => setIsEditing(true)} />;
  }

  return (
    <form
      ref={formRef}
      action={updateHealthLogAction}
      className="space-y-5 rounded-lg border bg-card p-4 sm:p-5"
    >
      <input type="hidden" name="id" value={log.id} />
      <input type="hidden" name="year" value={year} />

      <BipolarAwareFields
        defaultDate={log.date}
        defaultSubject={log.subject}
        defaultMoodScale={log.moodScale}
        defaultSleepHours={log.sleepHours}
        defaultWeight={log.weight}
        defaultMoodTags={log.moodTags}
        defaultMeasuredAt={log.measuredAt}
      />

      <Field label="컨디션 (전체)">
        <SeverityRadios defaultValue={log.severity} />
      </Field>

      <Field label="아픈 곳 / 증상">
        <TagPicker
          name="bodyTags"
          groups={BODY_TAG_GROUPS}
          defaultValue={log.bodyTags}
          selectedClass="bg-rose-500 text-white border-rose-500"
        />
      </Field>

      <Field label="기분 / 심리">
        <TagPicker
          name="moodTags"
          groups={MOOD_TAG_GROUPS}
          defaultValue={log.moodTags.filter((t) => !BIPOLAR_SIGNAL_TAGS.has(t))}
          selectedClass="bg-indigo-500 text-white border-indigo-500"
        />
      </Field>

      <Field label="생리">
        <MenstruationRadios defaultValue={log.menstruation} />
      </Field>

      <Field label="메모">
        <textarea
          name="note"
          rows={3}
          defaultValue={log.note ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          저장
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md border bg-background px-4 py-2 text-sm hover:bg-accent"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function ReadOnlyView({ log, onEdit }: { log: HealthLog; onEdit: () => void }) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <Row label="날짜">
        {log.date}
        {log.measuredAt && (
          <span className="ml-2 text-muted-foreground">
            · {log.measuredAt}
          </span>
        )}
      </Row>
      <Row label="대상자">{log.subject || "전체"}</Row>
      {log.severity ? (
        <Row label="컨디션">
          {log.severity} · {SEVERITY_LABEL[log.severity]}
        </Row>
      ) : null}
      {log.moodScale != null && (
        <Row label="조증/우울">
          <span
            className={
              log.moodScale > 0
                ? "text-orange-700"
                : log.moodScale < 0
                  ? "text-blue-700"
                  : ""
            }
          >
            {log.moodScale > 0 ? `+${log.moodScale}` : log.moodScale}
            {log.moodScale === 0 && " (평온)"}
          </span>
        </Row>
      )}
      {log.sleepHours != null && (
        <Row label="수면시간">{log.sleepHours} 시간</Row>
      )}
      {log.weight != null && (
        <Row label="체중">{log.weight} kg</Row>
      )}
      {log.bodyTags.length > 0 && (
        <Row label="아픈 곳 / 증상">
          <TagList tags={log.bodyTags} className="bg-rose-50 text-rose-700" />
        </Row>
      )}
      {log.moodTags.some((t) => MANIC_TAGS.has(t)) && (
        <Row label="조증 신호">
          <TagList
            tags={log.moodTags.filter((t) => MANIC_TAGS.has(t))}
            className="bg-orange-100 text-orange-800"
          />
        </Row>
      )}
      {log.moodTags.some((t) => DEPRESSIVE_TAGS.has(t)) && (
        <Row label="우울 신호">
          <TagList
            tags={log.moodTags.filter((t) => DEPRESSIVE_TAGS.has(t))}
            className="bg-blue-100 text-blue-800"
          />
        </Row>
      )}
      {log.moodTags.some((t) => ATTENDANCE_TAGS.has(t)) && (
        <Row label="출결">
          <TagList
            tags={log.moodTags.filter((t) => ATTENDANCE_TAGS.has(t))}
            className="bg-rose-100 text-rose-800"
          />
        </Row>
      )}
      {log.moodTags.some((t) => !BIPOLAR_SIGNAL_TAGS.has(t)) && (
        <Row label="기분 / 심리">
          <TagList
            tags={log.moodTags.filter((t) => !BIPOLAR_SIGNAL_TAGS.has(t))}
            className="bg-indigo-50 text-indigo-700"
          />
        </Row>
      )}
      {log.menstruation && (
        <Row label="생리">{MENSTRUATION_LABEL[log.menstruation]}</Row>
      )}
      {log.note && (
        <Row label="메모">
          <p className="whitespace-pre-wrap">{log.note}</p>
        </Row>
      )}

      <div className="pt-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          수정하기
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function TagList({ tags, className }: { tags: string[]; className: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className={`rounded-full px-2 py-0.5 text-xs ${className}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

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

function SeverityRadios({ defaultValue }: { defaultValue?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <RadioPill name="severity" value="" label="—" defaultChecked={!defaultValue} />
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
      <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-accent peer-checked:border-rose-500 peer-checked:bg-rose-500 peer-checked:text-white">
        {label}
      </span>
    </label>
  );
}
