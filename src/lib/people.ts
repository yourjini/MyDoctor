// Family members tracked across visits/appointments/checkups.
// "전체" = applies to the whole family / unassigned.

export const PEOPLE = ["전체", "박범진", "박란하", "최진희"] as const;
export type Person = (typeof PEOPLE)[number];

export const DEFAULT_PERSON: Person = "전체";

export function isPerson(value: unknown): value is Person {
  return typeof value === "string" && (PEOPLE as readonly string[]).includes(value);
}

export function asPerson(value: unknown): Person {
  return isPerson(value) ? value : DEFAULT_PERSON;
}

// First character of the given name as a compact avatar label.
// All three are distinct (범/란/진), 전체 → 전.
export const PERSON_INITIAL: Record<Person, string> = {
  전체: "전",
  박범진: "범",
  박란하: "란",
  최진희: "진",
};

export type PersonColor = {
  dot: string;
  pill: string;
  pillActive: string;
  avatar: string;
  ring: string;
};

// Static Tailwind class strings (Tailwind purges template-literal classes).
export const PERSON_COLORS: Record<Person, PersonColor> = {
  전체: {
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    pillActive: "bg-slate-700 text-white",
    avatar: "bg-slate-500 text-white",
    ring: "ring-slate-400",
  },
  박범진: {
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    pillActive: "bg-blue-600 text-white",
    avatar: "bg-blue-500 text-white",
    ring: "ring-blue-400",
  },
  박란하: {
    dot: "bg-pink-500",
    pill: "bg-pink-50 text-pink-700 hover:bg-pink-100",
    pillActive: "bg-pink-600 text-white",
    avatar: "bg-pink-500 text-white",
    ring: "ring-pink-400",
  },
  최진희: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    pillActive: "bg-emerald-600 text-white",
    avatar: "bg-emerald-500 text-white",
    ring: "ring-emerald-400",
  },
};

// When filtering by a specific person, also include "전체" records
// (they apply to everyone). When filter is "전체" itself, show all.
export function matchesFilter(recordSubject: string | undefined, filter: Person): boolean {
  if (filter === "전체") return true;
  const subject = asPerson(recordSubject);
  return subject === filter || subject === "전체";
}
