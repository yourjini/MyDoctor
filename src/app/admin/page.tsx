import { PageShell } from "@/components/PageShell";
import { findVisitAppointmentMatches } from "@/lib/matching";
import { LinkMatchesForm, type MatchRow } from "./LinkMatchesForm";
import { RebuildButton } from "./RebuildButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const matches = await findVisitAppointmentMatches();
  const rows: MatchRow[] = matches.map((m) => ({
    pair: `${m.visit.date.slice(0, 4)}:${m.visit.id}:${m.appointment.id}`,
    visitDate: m.visit.date,
    apptDatetime: m.appointment.datetime,
    dayDiff: m.dayDiff,
    nameExact: m.nameExact,
    subject: m.visit.subject,
    visitHospital: m.visit.hospitalName,
    apptHospital: m.appointment.hospitalName,
    diagnosis: m.visit.diagnosis,
    reason: m.appointment.reason,
  }));

  return (
    <PageShell title="관리자">
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold">
            방문-예약 자동 연결 ({rows.length}건 후보)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            아직 예약과 연결되지 않은 방문이력 중{" "}
            <strong>같은 대상자 · 같은 병원 · 날짜 ±1일</strong> 조건에 맞는
            쌍을 찾아줍니다. 체크한 쌍은{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              Visit.appointmentId
            </code>{" "}
            에 저장되고 캘린더에서 해당 예약은 숨겨집니다.
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>병원명 완전일치 아니면 "부분일치" 배지가 붙어요 — 꼭 확인</li>
            <li>잘못 연결하면 방문 상세 → 수정 → 셀렉트에서 "연결 안 함" 으로 되돌릴 수 있음</li>
            <li>데이터 레코드 자체는 안 지워짐 (예약도 그대로 남음)</li>
          </ul>
        </div>

        <LinkMatchesForm rows={rows} />
      </section>

      <section className="mt-6 space-y-4 rounded-lg border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold">매니페스트 재구성</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            visits / appointments / checkups / health 네 종류의 매니페스트
            (<code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              data/&lt;kind&gt;/_index.json
            </code>
            ) 를 전체 디렉토리를 walk 하여 다시 작성합니다.
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            <li>처음 매니페스트 도입 후 1회 권장</li>
            <li>외부에서 데이터 레포를 직접 수정한 뒤 (매니페스트가 어긋났을 때)</li>
            <li>매니페스트 파일이 깨졌을 때 (평소엔 자동 self-healing)</li>
          </ul>
        </div>

        <RebuildButton />

        <p className="text-xs text-muted-foreground">
          종류별로 1 GitHub 커밋 발생. 레코드 수에 따라 수초 ~ 수십 초 걸릴 수
          있습니다.
        </p>
      </section>
    </PageShell>
  );
}
