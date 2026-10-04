import Link from "next/link";
import { cn } from "@/lib/utils";

// 박란하 today-at-a-glance card.
// Pure presentation — caller computes the snapshot and passes it in.

export type LanhaSnapshot = {
  todayKey: string;
  latestMoodScale?: number; // -5..+5 (음수 = 우울, 양수 = 조증)
  latestMoodDate?: string;
  latestSleepHours?: number;
  latestSleepDate?: string;
  latestWeight?: number;
  latestWeightDate?: string;
  weightDeltaSinceStart?: number; // kg, + = 증가
  startWeight?: number;
};

const LANHA_SUBJECT = "%EB%B0%95%EB%9E%80%ED%95%98"; // encoded 박란하

export function LanhaTodayCard({ snap }: { snap: LanhaSnapshot }) {
  return (
    <section
      className="rounded-2xl border bg-gradient-to-br from-rose-50 via-background to-background p-4 sm:p-5 dark:from-rose-950/30"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-sm font-semibold text-white">
          란
        </span>
        <div>
          <h2 className="text-base font-semibold leading-tight">오늘의 란하</h2>
          <div className="mt-0.5 text-xs text-muted-foreground">
            최근 기록 {fmtDate(snap.latestMoodDate) || fmtDate(snap.latestSleepDate) || fmtDate(snap.latestWeightDate)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <TileLink
          href={`/health/new?subject=${LANHA_SUBJECT}&field=mood`}
          label="기분"
          value={moodLabel(snap.latestMoodScale)}
          sub={fmtDate(snap.latestMoodDate)}
          accent={moodAccent(snap.latestMoodScale)}
        />
        <TileLink
          href={`/health/new?subject=${LANHA_SUBJECT}&field=sleep`}
          label="수면"
          value={
            snap.latestSleepHours != null
              ? `${snap.latestSleepHours}h`
              : "—"
          }
          sub={fmtDate(snap.latestSleepDate)}
          accent={sleepAccent(snap.latestSleepHours)}
        />
        <TileLink
          href={`/health/new?subject=${LANHA_SUBJECT}&field=weight`}
          label="체중"
          value={
            snap.latestWeight != null ? `${snap.latestWeight}kg` : "—"
          }
          sub={
            snap.weightDeltaSinceStart != null
              ? `${snap.weightDeltaSinceStart >= 0 ? "+" : ""}${snap.weightDeltaSinceStart.toFixed(1)}kg`
              : fmtDate(snap.latestWeightDate)
          }
          accent={weightAccent(snap.weightDeltaSinceStart)}
        />
      </div>

      <Link
        href={`/health/new?subject=${LANHA_SUBJECT}`}
        className="mt-4 flex min-h-[52px] items-center justify-center rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
      >
        + 오늘 리포트 기록하기
      </Link>
    </section>
  );
}

function TileLink({
  href,
  label,
  value,
  sub,
  accent,
}: {
  href: string;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="group block min-h-[76px] rounded-xl border bg-card p-2.5 transition-colors hover:border-border/80 hover:bg-accent/40"
    >
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold leading-tight", accent)}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {sub}
        </div>
      )}
    </Link>
  );
}

function moodLabel(scale?: number): string {
  if (scale == null) return "—";
  if (scale <= -3) return `${scale} 우울`;
  if (scale < 0) return `${scale}`;
  if (scale === 0) return "0 평온";
  if (scale >= 3) return `+${scale} 조증`;
  return `+${scale}`;
}

function moodAccent(scale?: number): string {
  if (scale == null) return "text-muted-foreground";
  if (scale <= -3) return "text-indigo-700";
  if (scale >= 3) return "text-amber-700";
  return "text-foreground";
}

function sleepAccent(h?: number): string {
  if (h == null) return "text-muted-foreground";
  if (h < 6 || h > 11) return "text-rose-600";
  return "text-foreground";
}

function weightAccent(delta?: number): string {
  if (delta == null) return "text-foreground";
  if (delta >= 5) return "text-rose-600";
  if (delta >= 2) return "text-amber-700";
  if (delta <= -2) return "text-emerald-700";
  return "text-foreground";
}

function fmtDate(d?: string): string {
  if (!d) return "";
  const [, m, day] = d.split("-");
  if (!m || !day) return d;
  return `${Number(m)}/${Number(day)}`;
}
