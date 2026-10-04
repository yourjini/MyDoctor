"use server";

import { revalidatePath } from "next/cache";
import { listAllJSON } from "@/lib/github";
import { writeManifest } from "@/lib/manifest";
import type { Appointment, Checkup, HealthLog, Visit } from "@/lib/types";

// 모든 매니페스트를 재구성. 기존 레코드가 있는데 매니페스트가 없는 경우
// (step 2 배포 직후) 한 번 돌리면 즉시 N+1 → 1 call 로 전환.
// 이후에도 데이터 레포 외부에서 수동 수정했을 때 매니페스트를 다시 맞추려면
// 다시 돌리면 됨.

export type RebuildResult = {
  kind: string;
  count: number;
};

export async function rebuildAllManifestsAction(): Promise<RebuildResult[]> {
  const [visits, appointments, checkups, health] = await Promise.all([
    listAllJSON<Visit>("data/visits"),
    listAllJSON<Appointment>("data/appointments"),
    listAllJSON<Checkup>("data/checkups"),
    listAllJSON<HealthLog>("data/health"),
  ]);

  await writeManifest("visits", visits);
  await writeManifest("appointments", appointments);
  await writeManifest("checkups", checkups);
  await writeManifest("health", health);

  revalidatePath("/");
  revalidatePath("/visits");
  revalidatePath("/appointments");
  revalidatePath("/checkups");
  revalidatePath("/health");
  revalidatePath("/attachments");
  revalidatePath("/conditions");

  return [
    { kind: "visits", count: visits.length },
    { kind: "appointments", count: appointments.length },
    { kind: "checkups", count: checkups.length },
    { kind: "health", count: health.length },
  ];
}
