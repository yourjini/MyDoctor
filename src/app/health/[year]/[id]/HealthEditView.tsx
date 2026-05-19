"use client";

import { useRef, useState } from "react";
import {
  ATTENDANCE_TAGS,
  BIPOLAR_SIGNAL_TAGS,
  DEPRESSIVE_TAGS,
  MANIC_TAGS,
  MENSTRUATION_LABEL,
  SEVERITY_LABEL,
} from "@/lib/health-tags";
import { updateHealthLogAction } from "../../actions";
import { HealthLogFormBody } from "../../HealthLogFormBody";
import type { HealthLog } from "@/lib/types";

export function HealthEditView({
  log,
  year,
  latestBipolarWeight,
}: {
  log: HealthLog;
  year: string;
  latestBipolarWeight?: number;
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

      <HealthLogFormBody
        defaultDate={log.date}
        defaultSubject={log.subject}
        defaultSeverity={log.severity}
        defaultBodyTags={log.bodyTags}
        defaultMoodTags={log.moodTags}
        defaultMenstruation={log.menstruation}
        defaultNote={log.note}
        defaultMoodScale={log.moodScale}
        defaultSleepHours={log.sleepHours}
        defaultWeight={log.weight}
        defaultMeasuredAt={log.measuredAt}
        latestBipolarWeight={latestBipolarWeight}
      />

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
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
          <TagList tags={log.bodyTags} className="bg-slate-100 text-slate-700" />
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
            className="bg-red-100 text-red-800"
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
          className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
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
