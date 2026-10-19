"use server";

import { revalidatePath } from "next/cache";
import { listAllJSON } from "@/lib/github";
import { writeManifest } from "@/lib/manifest";
import { updateVisit } from "@/lib/store";
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

// 자동 매칭으로 뽑은 (visit, appointment) 쌍 중 사용자가 체크한 것만
// 실제로 Visit.appointmentId 에 저장. 쌍 포맷: `${visitYear}:${visitId}:${apptId}`.
export async function linkVisitAppointmentsAction(
  pairs: string[],
): Promise<{ linked: number; failed: Array<{ pair: string; message: string }> }> {
  let linked = 0;
  const failed: Array<{ pair: string; message: string }> = [];
  for (const pair of pairs) {
    const parts = pair.split(":");
    if (parts.length !== 3) {
      failed.push({ pair, message: "형식 오류" });
      continue;
    }
    const [year, visitId, apptId] = parts;
    if (!/^\d{4}$/.test(year) || !visitId || !apptId) {
      failed.push({ pair, message: "ID 오류" });
      continue;
    }
    try {
      const result = await updateVisit(year, visitId, { appointmentId: apptId });
      if (!result) {
        failed.push({ pair, message: "방문을 찾지 못함" });
        continue;
      }
      linked++;
    } catch (err) {
      failed.push({
        pair,
        message: err instanceof Error ? err.message : "실패",
      });
    }
  }
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/visits");
  revalidatePath("/appointments");
  return { linked, failed };
}
