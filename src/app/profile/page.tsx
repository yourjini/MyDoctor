import { PageShell } from "@/components/PageShell";
import { getProfile } from "@/lib/store";
import { ACTIVITY_LABEL, calculateAge } from "@/lib/calorie";
import { PEOPLE } from "@/lib/people";
import { saveProfileAction } from "./actions";
import type { PersonProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

const TRACKED_PEOPLE = PEOPLE.filter(
  (p) => p !== "전체" && p !== "박범진",
);

export default async function ProfilePage() {
  const profiles = await Promise.all(
    TRACKED_PEOPLE.map(async (p) => ({ person: p, profile: await getProfile(p) })),
  );

  return (
    <PageShell title="프로필">
      <p className="mb-4 text-sm text-muted-foreground">
        생년월일·키·활동량을 입력하면 칼로리 목표가 계산됩니다. 식단 관리에 사용돼요.
      </p>
      <div className="space-y-6">
        {profiles.map(({ person, profile }) => (
          <ProfileForm key={person} person={person} profile={profile} />
        ))}
      </div>
    </PageShell>
  );
}

function ProfileForm({
  person,
  profile,
}: {
  person: string;
  profile: PersonProfile | null;
}) {
  const age = profile?.birthDate ? calculateAge(profile.birthDate) : null;

  return (
    <form
      action={saveProfileAction}
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <input type="hidden" name="person" value={person} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{person}</h2>
        {age != null && (
          <span className="text-xs text-muted-foreground">만 {age}세</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="생년월일">
          <input
            type="date"
            name="birthDate"
            defaultValue={profile?.birthDate ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="키 (cm)">
          <input
            type="number"
            name="heightCm"
            min={50}
            max={250}
            step={0.1}
            defaultValue={profile?.heightCm ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="목표 체중 (kg)">
          <input
            type="number"
            name="targetWeightKg"
            min={20}
            max={200}
            step={0.1}
            defaultValue={profile?.targetWeightKg ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="기준 체중 (약 시작 전 등)">
          <input
            type="number"
            name="startWeightKg"
            min={20}
            max={200}
            step={0.1}
            defaultValue={profile?.startWeightKg ?? ""}
            placeholder="kg"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="기준일 (체중 기록 시점)">
          <input
            type="date"
            name="startWeightDate"
            defaultValue={profile?.startWeightDate ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="활동량">
        <div className="flex flex-wrap gap-1.5">
          {(["low", "light", "moderate", "active"] as const).map((v) => (
            <label key={v} className="cursor-pointer">
              <input
                type="radio"
                name="activity"
                value={v}
                defaultChecked={profile?.activity === v}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-accent peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white">
                {ACTIVITY_LABEL[v]}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="식단 스타일">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["lowcarb-lowfat", "저탄저지"],
              ["mediterranean", "지중해식"],
              ["balanced", "균형식"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="cursor-pointer">
              <input
                type="radio"
                name="dietStyle"
                value={v}
                defaultChecked={profile?.dietStyle === v}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-accent peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white">
                {label}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="알레르기·기피 (쉼표로 구분)">
        <input
          type="text"
          name="allergies"
          defaultValue={profile?.allergies?.join(", ") ?? ""}
          placeholder="예: 견과류, 새우"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="메모">
        <textarea
          name="notes"
          rows={2}
          defaultValue={profile?.notes ?? ""}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <div>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          저장
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
