// Seed entries for /cautions, derived from the user's reference txt about
// 박란하의 약물(자나팜·리튬·인데놀·콘서타·리투다·에프람) 상호작용. 사용자가
// 신뢰할 수 있는 URL을 요청했지만, 우리가 정확히 확인 가능한 출처는
// 사용자가 직접 제공한 Mayo Clinic 페이지 하나뿐이라 그것만 URL로 넣고,
// 나머지는 검색 시작점(약물 정보 사이트)을 descriptive source로 남긴다.
// 사용자가 /cautions/[id]에서 편집해 추가 URL을 채울 수 있다.

import type { CautionItem } from "./types";

export type CautionSeed = Omit<
  CautionItem,
  "id" | "kind" | "createdAt" | "updatedAt"
>;

const MAYO_AD_ALC =
  "https://www.mayoclinic.org/diseases-conditions/depression/expert-answers/antidepressants-and-alcohol/faq-20058231";

export const CAUTION_SEEDS: CautionSeed[] = [
  {
    subject: "박란하",
    name: "맥주·소주·와인 (모든 알코올)",
    severity: "danger",
    category: "술",
    medications: [
      "자나팜",
      "리튬",
      "인데놀",
      "콘서타",
      "리투다",
      "에프람",
    ],
    reason: [
      "복용 중인 약물 6종 모두 알코올과 위험하게 상호작용합니다.",
      "",
      "🚨 호흡 마비 / 급사: 자나팜(알프라졸람)은 중추신경 억제제로, 술과 함께 먹으면 억제 효과가 몇 배로 증폭(상승작용)되어 자다가 숨이 멎는 호흡 마비, 심장마비, 혼수상태를 유발할 수 있습니다.",
      "",
      "⚠️ 리튬 독성: 알코올 이뇨 작용으로 탈수가 오면 혈중 리튬 농도가 급격히 상승해 영구 신장 손상, 심한 손떨림, 발작이 나타날 수 있습니다.",
      "",
      "📉 저혈압 / 실신: 인데놀(프로프라놀롤)과 합쳐지면 혈압이 급격히 떨어져 기립성 저혈압·낙상.",
      "",
      "🧠 정신증상 악화: 리투다·에프람과 술이 만나면 극심한 졸음, 기억상실(필름끊김), 충동조절 장애. 우울·불안 증상도 도리어 심해집니다.",
      "",
      "맥주 한 잔이라도 안 됩니다. 점심에 약 먹고 저녁에 술 마시는 것도 위험합니다 — 약 성분이 온종일 몸에 남아있습니다.",
    ].join("\n"),
    source: MAYO_AD_ALC,
  },
  {
    subject: "박란하",
    name: "핫식스·레드불 등 에너지드링크",
    severity: "danger",
    category: "카페인",
    medications: ["콘서타", "자나팜", "인데놀"],
    reason: [
      "콘서타는 이미 중추신경을 강하게 자극하는 약물. 여기에 고농도 카페인+타우린이 합쳐지면 심박수 급증, 혈압 상승, 극심한 가슴 두근거림(심계항진). 심하면 부정맥·공황 발작.",
      "",
      "또한 불안을 낮추는 자나팜, 심장을 안정시키는 인데놀과는 정반대 방향 — 브레이크와 액셀을 동시에 밟는 셈이라 약효가 상쇄됩니다.",
    ].join("\n"),
    source: "Drugs.com 약물 상호작용 데이터베이스 — methylphenidate + caffeine",
  },
  {
    subject: "박란하",
    name: "커피 (아메리카노 포함)",
    severity: "warning",
    category: "카페인",
    medications: ["리튬", "에프람", "콘서타"],
    reason: [
      "카페인이 신장에서 리튬 배출을 촉진해 혈중 농도를 떨어뜨립니다. 약을 먹어도 효과가 약해져 기분 불안정이 다시 올라올 수 있습니다.",
      "",
      "더 까다로운 점 — 매일 마시다 갑자기 끊으면 반대로 리튬 농도가 2배 가까이 치솟아 리튬 독성(손떨림·구토·혼수)이 나타날 수 있습니다. 마실 거면 매일 정확히 일정량만.",
      "",
      "에프람(SSRI)과 만나면 중추신경 과자극으로 극심한 불면·불안·손떨림이 심해집니다. 디카페인 권장.",
    ].join("\n"),
    source: "Mayo Clinic / 약학정보원 — lithium + caffeine 상호작용",
  },
  {
    subject: "박란하",
    name: "말차라떼 (녹차 가루)",
    severity: "warning",
    category: "카페인",
    medications: ["리튬", "콘서타"],
    reason: [
      "녹차 잎을 통째로 갈아 만든 말차는 일반 녹차보다 카페인 함량이 훨씬 높습니다. 카페에서 파는 말차라떼 한 잔이 에스프레소 1샷에 맞먹는 카페인.",
      "",
      "결과: 카페인이 리튬을 체외로 빠르게 배출 → 약효 저하, 기분조절 실패. 콘서타와 만나 심장 두근거림·불안·손떨림.",
    ].join("\n"),
    source: "약학정보원 — caffeine content in matcha",
  },
  {
    subject: "박란하",
    name: "콜라·사이다 (탄산음료)",
    severity: "caution",
    category: "카페인",
    medications: ["리튬", "콘서타"],
    reason: [
      "커피·핫식스보다는 카페인 함량이 적지만 콜라류는 여전히 카페인이 들어있어 리튬·콘서타에 미량의 악영향. 탄산이 마시고 싶다면 카페인 없는 사이다나 탄산수로 대체.",
    ].join("\n"),
    source: "사용자 메모 + 약학정보원",
  },
  {
    subject: "박란하",
    name: "마라탕·엽기떡볶이 (매우 짜고 매운 음식)",
    severity: "warning",
    category: "자극적",
    medications: ["리튬"],
    reason: [
      "리튬은 몸속 염분(나트륨) 농도에 극도로 민감합니다.",
      "",
      "짠 음식을 갑자기 많이 먹으면 몸이 나트륨을 배출하면서 리튬까지 함께 배출 → 약효가 떨어집니다.",
      "",
      "반대로 매운 음식 먹고 설사·땀으로 탈수가 오면 혈중 리튬 농도가 치솟아 리튬 독성(구토·심한 손떨림)이 생길 수 있습니다.",
      "",
      "항상 일정한 간으로 식사하는 것이 중요합니다.",
    ].join("\n"),
    source: "사용자 메모 + 약학정보원 lithium toxicity",
  },
  {
    subject: "박란하",
    name: "다크 초콜릿·자바칩 음료 (카카오 다량)",
    severity: "caution",
    category: "식품",
    medications: ["콘서타", "에프람"],
    reason: [
      "카카오 함량이 높은 다크 초콜릿이나 초콜릿 칩이 많이 들어간 스무디 등에는 카페인 + 테오브로민이라는 자극 성분이 생각보다 많이 들어있습니다.",
      "",
      "콘서타와 만나 뇌를 과도하게 각성 → 밤에 잠 안 옴, 가슴 답답함, 불안. 밀크초콜릿이나 화이트초콜릿으로 소량만.",
    ].join("\n"),
    source: "사용자 메모",
  },
  {
    subject: "박란하",
    name: "자몽·자몽에이드·자몽 타르트",
    severity: "warning",
    category: "식품",
    medications: ["자나팜", "에프람"],
    reason: [
      "자몽은 간에서 약물을 분해하는 효소(CYP3A4 등)를 강력하게 방해합니다.",
      "",
      "그러면 약이 몸 밖으로 빠져나가지 못하고 계속 쌓여 자나팜 농도가 너무 높아짐 → 낮에도 하루 종일 인지 기능 저하, 심한 졸음, 무기력증.",
      "",
      "자몽 향이 나는 디저트도 주의 (자몽 타르트, 자몽 에이드 등).",
    ].join("\n"),
    source: "FDA Grapefruit + drug interactions / CYP3A4 inhibition 문헌",
  },
  {
    subject: "박란하",
    name: "종합감기약·코감기약 (슈도에페드린 함유)",
    severity: "warning",
    category: "약물",
    medications: ["콘서타"],
    reason: [
      "음식은 아니지만 학교생활 중 흔히 접하는 약. 종합/코감기약에는 슈도에페드린 등 교감신경 흥분 성분이 많아 콘서타와 함께 먹으면 혈압이 오르고 심장이 터질 듯이 뜁니다.",
      "",
      "감기약 처방받을 때 반드시 의사·약사에게 정신과 약 6종 복용 중임을 알려야 합니다. 다이어트 보조제·여드름약도 임의 복용 금지.",
    ].join("\n"),
    source: "사용자 메모",
  },
];
