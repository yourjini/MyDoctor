// 부위별 질환 트래커 프리셋 + 상태 메타 + 시드 데이터.

import type {
  BodyPart,
  ConditionStatus,
  ExamType,
  HealthCondition,
  ConditionExam,
} from "./types";

export const BODY_PARTS: BodyPart[] = [
  "유방",
  "갑상선",
  "위",
  "자궁",
  "자궁경부",
  "폐",
  "간",
  "대장",
  "골밀도",
  "심혈관",
  "기타",
];

export const EXAM_TYPES: ExamType[] = [
  "초음파",
  "조직검사",
  "CT",
  "내시경",
  "혈액",
  "엑스레이",
  "기타",
];

export const STATUS_LIST: ConditionStatus[] = [
  "검사필요",
  "치료중",
  "추적중",
  "해결됨",
];

// 목록 그룹/정렬 우선순위. 작을수록 위. (cautions의 SEVERITY_ORDER 패턴)
export const STATUS_ORDER: Record<ConditionStatus, number> = {
  검사필요: 0,
  치료중: 1,
  추적중: 2,
  해결됨: 3,
};

export const STATUS_META: Record<
  ConditionStatus,
  { label: string; chip: string; card: string }
> = {
  검사필요: {
    label: "검사 필요",
    chip: "bg-amber-500 text-white",
    card: "border-amber-200",
  },
  치료중: {
    label: "치료 중",
    chip: "bg-violet-100 text-violet-700",
    card: "border-violet-200",
  },
  추적중: {
    label: "추적 중",
    chip: "bg-emerald-100 text-emerald-700",
    card: "border-emerald-200",
  },
  해결됨: {
    label: "해결됨",
    chip: "bg-slate-100 text-slate-500",
    card: "border-slate-200",
  },
};

export function isConditionStatus(v: unknown): v is ConditionStatus {
  return (
    typeof v === "string" &&
    (STATUS_LIST as readonly string[]).includes(v)
  );
}

// ============================================================
// 시드 데이터 — 최진희 (1979.05.06). 사용자 제공 md 기반 수기 정리.
// 자동 호출/외부 API 없이 하드코딩. 출처 URL은 넣지 않음(기관명만).
// ============================================================

export type ConditionSeed = {
  condition: Omit<
    HealthCondition,
    "id" | "kind" | "createdAt" | "updatedAt"
  >;
  exams: Omit<
    ConditionExam,
    "id" | "kind" | "conditionId" | "subject" | "createdAt" | "updatedAt"
  >[];
};

const SUBJECT = "최진희";

export const CONDITION_SEEDS: ConditionSeed[] = [
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "갑상선",
      diagnosis: "우측 17mm 혼합 고형결절",
      status: "검사필요",
      summary:
        "우측 17mm 혼합 고형결절. 종합검진에서 조직검사 권고. 갑상선 기능(TSH 1.3 / Free T4 1.2)은 정상.",
      nextAction: "조직검사 예정",
    },
    exams: [
      {
        date: "2026-02-21",
        org: "메디스캔",
        examType: "초음파",
        findings:
          "우측 1.6cm 결절, 우측 4mm × 2개, 목 림프절 4mm 신규(지켜봐야 함).",
      },
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "초음파",
        findings:
          "우측 17mm 혼합 고형결절. 악성 가능성은 낮으나 크기가 커 조직검사 권고. TSH 1.3 / Free T4 1.2 정상.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "유방",
      diagnosis: "양성 섬유선종 (다발성)",
      status: "추적중",
      summary:
        "좌측 9시 섬유선종(제거 기준), 우측 물혹 경과관찰. 조직검사로 양성 확인됨. 정기 초음파 추적.",
      nextAction: "정기 초음파",
    },
    exams: [
      {
        date: "2026-02-21",
        org: "메디스캔",
        examType: "초음파",
        findings:
          "좌측 9시 방향 섬유선종(제거 기준). 우측 물혹 7mm → 9mm 증가(모양 양호). 7mm 섬유선종, 유두 근처 4mm, 다발 물혹 존재.",
      },
      {
        date: "2026-03-10",
        examType: "조직검사",
        findings: "양성 섬유선종 확인, 특이사항 없음.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "위",
      diagnosis: "만성위축성위염 + 장상피화생",
      status: "추적중",
      summary:
        "만성위축성위염에 장상피화생이 새로 확인됨(위·중체부·전벽). 정기 내시경 추적 필요. 짠 음식·탄 음식·과식 자제 권고.",
      nextAction: "정기 위내시경",
    },
    exams: [
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "내시경",
        findings:
          "위내시경 + 조직검사로 만성위축성위염 + 장상피화생 확진. 위·중체부·전벽 분포. 이전 검진의 위축성 위염만 있던 것에서 장상피화생 신규. 정기 내시경·식이 조절 권고.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "자궁",
      diagnosis: "자궁근종 (max 37mm)",
      status: "추적중",
      summary:
        "자궁근종 최대 37mm. 산부인과 정기 추적. CA125 57.6(↑)은 근종 영향으로 추정되며 ROMA 8.3%로 난소암 위험은 정상 범위.",
      nextAction: "산부인과 정기",
    },
    exams: [
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "초음파",
        findings:
          "자궁근종 max 37mm. 호르몬 E2 139 / FSH 4.6 / LH 11.6. CA125 57.6(참고치 0~35, 근종 영향 추정), ROMA 폐경전 8.3%(정상).",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "간",
      diagnosis: "간 혈관종(양성) + 경도 지방간",
      status: "추적중",
      summary:
        "간 혈관종(양성)과 경도 지방간. 1년 주기 복부 CT 추적. 간기능(AST 30 / ALT 26 / γ-GTP 16)은 정상.",
      nextAction: "복부 CT (1년 주기)",
      nextDate: "2026-08-01",
    },
    exams: [
      {
        date: "2025-09-01",
        examType: "CT",
        findings: "복부 CT — 간 혈관종 추적, 경도 지방간. 정기 추적 권고.",
      },
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "혈액",
        findings: "간기능 AST 30 / ALT 26 / γ-GTP 16 모두 정상.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "폐",
      diagnosis: "폐결절(GGN) 이력",
      status: "추적중",
      summary:
        "3년 전 간유리음영(GGN) 발견, 재발 위험 0%로 안내받음. 흉부 X-ray 정상. 연 1회 정기 추적.",
      nextAction: "연 1회 정기 (폐 CT 예정)",
    },
    exams: [
      {
        date: "2023-01-01",
        examType: "CT",
        findings: "간유리음영(GGN) 발견. 이후 재발 위험 0% 안내(의사 상담).",
      },
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "엑스레이",
        findings: "흉부 X-ray 정상.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "자궁경부",
      diagnosis: "반응성 세포 변화",
      status: "추적중",
      summary: "자궁경부 세포검사에서 반응성 세포 변화(양성). 6개월 후 정기검진 권고.",
      nextAction: "6개월 후 정기검진",
    },
    exams: [
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "기타",
        findings: "자궁경부 세포검사 — 반응성 세포 변화(양성). 6개월 후 정기검진 권고.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "대장",
      diagnosis: "대장 게실",
      status: "추적중",
      summary: "대장 게실. 증상 없음. 증상 생기면 진료, 정기 추적.",
      nextAction: "정기 추적",
    },
    exams: [
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "기타",
        findings: "대장 게실 확인. 증상 없음. 증상 시 진료 권고.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "골밀도",
      diagnosis: "골감소증 (T-score −1.2)",
      status: "추적중",
      summary:
        "골감소증(T-score −1.2). 칼슘·비타민D 섭취와 체중부하 운동(볼링 등)으로 관리, 추적.",
      nextAction: "추적 (칼슘·비타민D)",
    },
    exams: [
      {
        date: "2025-01-01",
        examType: "기타",
        findings: "골밀도 검사 — 골감소증 T-score −1.2.",
      },
    ],
  },
  {
    condition: {
      subject: SUBJECT,
      bodyPart: "심혈관",
      diagnosis: "서맥 + 콜레스테롤 경계",
      status: "추적중",
      summary:
        "직업적 서맥(저강도). 혈압 98/64(낮은 편). 총콜레스테롤 200(경계), 3개월 후 추적 권고.",
      nextAction: "3개월 후 추적 (콜레스테롤)",
    },
    exams: [
      {
        date: "2026-03-28",
        org: "하정메디퍼스",
        examType: "혈액",
        findings:
          "심전도 서맥(직업적). 혈압 98/64. 총콜레스테롤 200(경계, 130~199), LDL 111 / HDL 73 / 중성지방 78. 3개월 후 추적 권고.",
      },
    ],
  },
];
