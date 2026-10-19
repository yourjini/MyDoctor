// 과거 방문이력과 예약을 자동으로 매칭. "같은 대상자 + 같은 병원 + 날짜 ±1일"
// 기준으로 아직 연결 안 된 쌍을 찾아 /admin 에서 사용자가 미리보기 후 적용.

import "server-only";

import { listAppointments, listVisits } from "./store";
import type { Appointment, Visit } from "./types";

export type MatchCandidate = {
  visit: Visit;
  appointment: Appointment;
  dayDiff: number; // 방문일 - 예약일 (일 단위, 절대값)
  nameExact: boolean; // 병원명 완전일치 (정규화 후)
};

// 병원명을 정규화. 공백/구두점 제거, 대소문자 통일, 자주 쓰이는 접미사 제거.
function normalizeHospital(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[().,·‧\-_/]/g, "")
    .replace(/(의원|병원|클리닉|센터|hospital|clinic)$/i, "");
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function findVisitAppointmentMatches(): Promise<MatchCandidate[]> {
  const [visits, appts] = await Promise.all([listVisits(), listAppointments()]);

  // 이미 어떤 visit 과 연결된 예약은 후보에서 제외.
  const linked = new Set(
    visits.map((v) => v.appointmentId).filter((x): x is string => !!x),
  );
  const unlinkedVisits = visits.filter((v) => !v.appointmentId);
  const unlinkedAppts = appts.filter((a) => !linked.has(a.id));

  // 하나의 예약은 하나의 방문에만 매칭되어야 함. visit 각자 best 를 고른 뒤,
  // 같은 appointment 를 노리는 visit 들 중 가장 가까운 쪽에게 양보.
  type Pick = { visit: Visit; cand: MatchCandidate };
  const picksByAppt = new Map<string, Pick>();

  for (const v of unlinkedVisits) {
    const vDate = Date.parse(`${v.date}T00:00:00`);
    const vSubject = v.subject ?? "";
    const vName = normalizeHospital(v.hospitalName);
    if (!vName) continue;

    let best: MatchCandidate | null = null;
    for (const a of unlinkedAppts) {
      const aSubject = a.subject ?? "";
      if (vSubject !== aSubject) continue;
      const aName = normalizeHospital(a.hospitalName);
      if (!aName) continue;
      const nameExact = aName === vName;
      const nameContains = aName.includes(vName) || vName.includes(aName);
      if (!nameExact && !nameContains) continue;

      const aDate = Date.parse(a.datetime);
      if (Number.isNaN(aDate)) continue;
      const dayDiff = Math.abs(aDate - vDate) / DAY_MS;
      if (dayDiff > 1) continue;

      const cand: MatchCandidate = {
        visit: v,
        appointment: a,
        dayDiff,
        nameExact,
      };
      if (!best || isBetter(cand, best)) best = cand;
    }

    if (best) {
      const prev = picksByAppt.get(best.appointment.id);
      if (!prev || isBetter(best, prev.cand)) {
        picksByAppt.set(best.appointment.id, { visit: v, cand: best });
      }
    }
  }

  // 날짜 가까운 순 → 병원명 완전일치 우선.
  return Array.from(picksByAppt.values())
    .map((p) => p.cand)
    .sort((a, b) => {
      if (a.dayDiff !== b.dayDiff) return a.dayDiff - b.dayDiff;
      if (a.nameExact !== b.nameExact) return a.nameExact ? -1 : 1;
      return a.visit.date.localeCompare(b.visit.date);
    });
}

function isBetter(a: MatchCandidate, b: MatchCandidate): boolean {
  if (a.dayDiff !== b.dayDiff) return a.dayDiff < b.dayDiff;
  if (a.nameExact !== b.nameExact) return a.nameExact;
  return false;
}
