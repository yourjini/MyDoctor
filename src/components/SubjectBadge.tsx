import { asPerson, PERSON_COLORS, PERSON_INITIAL } from "@/lib/people";
import { cn } from "@/lib/utils";

export function SubjectBadge({
  subject,
  size = "sm",
  showName = false,
  className,
}: {
  subject?: string;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
  className?: string;
}) {
  const person = asPerson(subject);
  const colors = PERSON_COLORS[person];
  const initial = PERSON_INITIAL[person];

  const sizeClasses = {
    xs: "h-4 w-4 text-[9px]",
    sm: "h-5 w-5 text-[10px]",
    md: "h-7 w-7 text-xs",
  }[size];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium",
          colors.avatar,
          sizeClasses,
        )}
        aria-label={`대상자: ${person}`}
        title={person}
      >
        {initial}
      </span>
      {showName && (
        <span className="text-xs text-muted-foreground">{person}</span>
      )}
    </span>
  );
}
