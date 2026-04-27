const TYPES = [
  "내과",
  "외과",
  "산부인과",
  "정형외과",
  "피부과",
  "안과",
  "이비인후과",
  "치과",
  "정신건강의학과",
  "한의원",
  "기타",
];

export function HospitalTypeSelect({
  name = "hospitalType",
  defaultValue,
}: {
  name?: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? "내과"}
      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
    >
      {TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
