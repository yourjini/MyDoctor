import { PEOPLE, DEFAULT_PERSON } from "@/lib/people";

export function SubjectSelect({
  name = "subject",
  defaultValue,
}: {
  name?: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? DEFAULT_PERSON}
      className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed"
    >
      {PEOPLE.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
