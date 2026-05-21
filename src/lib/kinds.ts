export type RecordKind = "visit" | "appointment" | "checkup" | "health";

export const KIND_LABEL: Record<RecordKind, string> = {
  visit: "방문이력",
  appointment: "예약",
  checkup: "건강검진",
  health: "데일리리포트",
};

export type KindStyle = {
  // Soft chip for inline labels and the "type indicator" banner.
  chip: string;
  // Solid filled button for primary actions (e.g. add buttons).
  solid: string;
  // Small dot for legends.
  dot: string;
};

// Static class strings (Tailwind purges template-literal classes).
export const KIND_STYLES: Record<RecordKind, KindStyle> = {
  visit: {
    chip: "bg-emerald-100 text-emerald-900 border-emerald-200",
    solid: "bg-emerald-600 text-white hover:bg-emerald-700",
    dot: "bg-emerald-500",
  },
  appointment: {
    chip: "bg-amber-100 text-amber-900 border-amber-200",
    solid: "bg-amber-500 text-white hover:bg-amber-600",
    dot: "bg-amber-500",
  },
  checkup: {
    chip: "bg-violet-100 text-violet-900 border-violet-200",
    solid: "bg-violet-600 text-white hover:bg-violet-700",
    dot: "bg-violet-500",
  },
  health: {
    chip: "bg-rose-100 text-rose-900 border-rose-200",
    solid: "bg-rose-500 text-white hover:bg-rose-600",
    dot: "bg-rose-500",
  },
};
