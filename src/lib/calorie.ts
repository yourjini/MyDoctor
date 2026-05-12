import type { ActivityLevel, PersonProfile } from "./types";

// Mifflin-St Jeor for adolescents/adults; assumes 여성 (this app is scoped to
// 박란하/최진희). For males multiply +166 vs −161 — we don't track sex on the
// profile, so this is calibrated for the actual users.
function bmrFemale(weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  low: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  low: "거의 안 함",
  light: "가벼움 (산책)",
  moderate: "보통 (주 3회 운동)",
  active: "활발",
};

export type CalorieTarget = {
  bmr: number;
  tdee: number; // 유지 칼로리
  target: number; // 감량 목표 칼로리 (보통 TDEE - 500, 청소년 1200 미만 금지)
  deficit: number;
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

// Compute target. Returns null if profile lacks any required field
// (birthDate, heightCm) or there is no current weight.
export function calorieTargetFor(
  profile: PersonProfile | null,
  currentWeightKg: number | null,
): CalorieTarget | null {
  if (!profile) return null;
  const { birthDate, heightCm, activity } = profile;
  if (!birthDate || !heightCm) return null;
  if (currentWeightKg == null || currentWeightKg <= 0) return null;
  const age = calculateAge(birthDate);
  if (age < 8 || age > 80) return null;
  const factor = ACTIVITY_FACTOR[activity ?? "light"];
  const bmr = Math.round(bmrFemale(currentWeightKg, heightCm, age));
  const tdee = Math.round(bmr * factor);
  // Aim for ~500 kcal/day deficit (≈0.5kg/week) but never below 1300 for
  // an adolescent on psychiatric meds — avoid restrictive intake triggering
  // mood swings or rebound binging.
  const minIntake = age < 18 ? 1400 : 1300;
  const naiveTarget = tdee - 500;
  const target = Math.max(naiveTarget, minIntake);
  return {
    bmr,
    tdee,
    target,
    deficit: tdee - target,
  };
}

export function sumCalories(
  meals: { calories?: number }[],
): { kcal: number; counted: number; missing: number } {
  let kcal = 0;
  let counted = 0;
  let missing = 0;
  for (const m of meals) {
    if (typeof m.calories === "number") {
      kcal += m.calories;
      counted += 1;
    } else {
      missing += 1;
    }
  }
  return { kcal, counted, missing };
}
