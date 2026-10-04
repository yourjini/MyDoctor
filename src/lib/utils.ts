import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const base = `${yyyy}-${mm}-${dd}`;
  if (!withTime) return base;
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${base} ${hh}:${min}`;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function todayKST(): { year: number; month0: number; day: number; key: string } {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month0 = kst.getUTCMonth();
  const day = kst.getUTCDate();
  const key = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { year, month0, day, key };
}

const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-10-04" → "10월 4일 (일)"
export function formatKoreanDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  // Pure math — avoid Date timezone confusion for a date-only key.
  const weekday = KOREAN_WEEKDAYS[weekdayOf(y, m, d)];
  return `${m}월 ${d}일 (${weekday})`;
}

// Zeller 변형이 아니라 Sakamoto — 1 Jan 1900 = Monday 기준 요일 계산.
function weekdayOf(y: number, m: number, d: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const yy = m < 3 ? y - 1 : y;
  return (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1] + d) % 7;
}
