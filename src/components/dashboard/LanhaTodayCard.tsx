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

export function LanhaTodayCard({ snap }: { snap: LanhaSnapshot }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-xs font-medium text-white">
            란
          </span>
          <h2 className="text-sm font-semibold">오늘의 란하</h2>
        </div>
        <Link
          href="/health/new?subject=%EB%B0%95%EB%9E%80%ED%95%98"
          className="rounded-md bg-rose-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-600"
        >
          + 일지
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Tile
          label="기분"
          value={moodLabel(snap.latestMoodScale)}
          sub={fmtDate(snap.latestMoodDate)}
          accent={moodAccent(snap.latestMoodScale)}
        />
        <Tile
          label="수면"
          value={
            snap.latestSleepHours != null
              ? `${snap.latestSleepHours}h`
              : "—"
          }
          sub={fmtDate(snap.latestSleepDate)}
          accent={sleepAccent(snap.latestSleepHours)}
        />
        <Tile
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
    </section>
  );
}

function Tile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md border bg-background/40 p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-lg font-semibold leading-tight", accent)}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
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
  if (!d) return "기록 없음";
  const [, m, day] = d.split("-");
  if (!m || !day) return d;
  return `${Number(m)}/${Number(day)}`;
}
