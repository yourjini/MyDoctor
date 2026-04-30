import { KIND_LABEL, KIND_STYLES, type RecordKind } from "@/lib/kinds";
import { cn } from "@/lib/utils";

export function KindChip({
  kind,
  size = "md",
  className,
}: {
  kind: RecordKind;
  size?: "sm" | "md";
  className?: string;
}) {
  const styles = KIND_STYLES[kind];
  const label = KIND_LABEL[kind];
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[11px]"
      : "px-2.5 py-1 text-xs sm:text-sm";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        styles.chip,
        sizeClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  );
}
