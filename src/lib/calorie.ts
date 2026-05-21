import type { ActivityLevel } from "./types";

// 프로필 표시용 라벨/나이 계산. (칼로리 목표 계산 기능은 제거됨)

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  low: "거의 안 함",
  light: "가벼움 (산책)",
  moderate: "보통 (주 3회 운동)",
  active: "활발",
};

export function calculateAge(birthDate: string, today = new Date()): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return 0;
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}
