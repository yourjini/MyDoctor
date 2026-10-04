// 모든 레코드의 첨부파일을 하나의 리스트로 모은 통합 뷰 데이터.
// visits + checkups 를 돌면서 각 레코드의 첨부파일 메타데이터와
// 상위 레코드의 컨텍스트(날짜/병원명/대상자/원본 레코드 링크) 를 묶는다.

import "server-only";

import { listCheckups, listVisits } from "./store";
import type { Person } from "./people";
import type { Attachment } from "./types";

export type AttachmentCard = {
  attachment: Attachment;
  date: string; // YYYY-MM-DD
  subject?: Person | string;
  hospitalName?: string;
  recordKind: "visit" | "checkup";
  recordId: string;
  recordTitle: string;
  sourceHref: string;
};

export async function listAllAttachments(): Promise<AttachmentCard[]> {
  const [visits, checkups] = await Promise.all([listVisits(), listCheckups()]);
  const out: AttachmentCard[] = [];

  for (const v of visits) {
    for (const a of v.attachments) {
      out.push({
        attachment: a,
        date: v.date,
        subject: v.subject,
        hospitalName: v.hospitalName,
        recordKind: "visit",
        recordId: v.id,
        recordTitle: `${v.hospitalName} · ${v.diagnosis}`,
        sourceHref: `/visits/${v.date.slice(0, 4)}/${v.id}`,
      });
    }
  }

  for (const c of checkups) {
    for (const a of c.attachments) {
      out.push({
        attachment: a,
        date: c.date,
        subject: c.subject,
        hospitalName: c.hospitalName,
        recordKind: "checkup",
        recordId: c.id,
        recordTitle: c.title,
        sourceHref: `/checkups/${c.date.slice(0, 4)}/${c.id}`,
      });
    }
  }

  return out.sort((a, b) => b.date.localeCompare(a.date));
}

// 모든 첨부에서 등장한 병원명 모음 (필터 드롭다운용).
export function distinctHospitalsOf(items: AttachmentCard[]): string[] {
  const set = new Set<string>();
  for (const it of items) {
    if (it.hospitalName) set.add(it.hospitalName);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}
