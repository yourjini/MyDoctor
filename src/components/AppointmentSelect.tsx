"use client";

import type { Appointment } from "@/lib/types";

// 방문이력 폼의 "연결된 예약" 셀렉트. 선택되면 캘린더에서 해당 예약은 숨겨짐
// (중복 표시 방지). onChange 로 폼 자동채움도 가능.
export function AppointmentSelect({
  name = "appointmentId",
  appointments,
  defaultValue = "",
  onPick,
}: {
  name?: string;
  appointments: Appointment[];
  defaultValue?: string;
  onPick?: (a: Appointment | null) => void;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => {
        if (!onPick) return;
        const a = appointments.find((x) => x.id === e.target.value) ?? null;
        onPick(a);
      }}
      className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
    >
      <option value="">— 연결 안 함 —</option>
      {appointments.map((a) => (
        <option key={a.id} value={a.id}>
          {formatApptLabel(a)}
        </option>
      ))}
    </select>
  );
}

function formatApptLabel(a: Appointment): string {
  const d = new Date(a.datetime);
  const dateStr = Number.isNaN(d.getTime())
    ? a.datetime.slice(0, 10)
    : `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${WEEK[d.getDay()]} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const parts = [dateStr, a.hospitalName];
  if (a.subject) parts.push(`(${a.subject})`);
  if (a.reason) parts.push(a.reason);
  return parts.join(" · ");
}

const WEEK = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
